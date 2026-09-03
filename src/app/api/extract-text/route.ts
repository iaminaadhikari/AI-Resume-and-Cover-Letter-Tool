import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import JSZip from "jszip";

async function extractDocxStyles(buffer: Buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file("word/document.xml")?.async("string");
    const stylesXml = await zip.file("word/styles.xml")?.async("string");
    
    const combinedXml = (docXml || "") + (stylesXml || "");
    
    // Find all hex colors
    const colors = combinedXml.match(/w:color w:val="([0-9a-fA-F]{6})"/g) || [];
    const colorCounts: Record<string, number> = {};
    colors.forEach(c => {
      const hex = c.match(/"([^"]+)"/)?.[1]?.toUpperCase();
      // Ignore pure black, pure white, and common grays for accent detection
      if (hex && hex !== "000000" && hex !== "FFFFFF" && hex !== "AUTO" && !hex.startsWith("4") && !hex.startsWith("5")) {
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }
    });
    
    const sortedColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
    const headingColor = sortedColors.length > 0 ? sortedColors[0] : null;

    // Find fonts
    const fonts = combinedXml.match(/w:rFonts[^>]*w:ascii="([^"]+)"/g) || [];
    const fontCounts: Record<string, number> = {};
    fonts.forEach(f => {
      const name = f.match(/w:ascii="([^"]+)"/)?.[1];
      if (name && name !== "Symbol" && name !== "Wingdings") {
        fontCounts[name] = (fontCounts[name] || 0) + 1;
      }
    });
    
    const sortedFonts = Object.keys(fontCounts).sort((a, b) => fontCounts[b] - fontCounts[a]);
    const bodyFont = sortedFonts.length > 0 ? sortedFonts[0] : null;
    const headingFont = sortedFonts.length > 1 ? sortedFonts[1] : bodyFont;

    return {
      headingColor,
      headingFont,
      bodyFont,
    };
  } catch (e) {
    console.error("Failed to extract DOCX styles:", e);
    return null;
  }
}

async function extractPdfStyles(buffer: Buffer): Promise<any> {
  // pdf2json was throwing "Warning: Unsupported: field.type of Link" and we don't 
  // strictly need PDF color extraction if it compromises the link extraction pipeline.
  // Returning null falls back to default styles safely.
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = "";
    let styleProfile = null;
    const linksMap: Record<string, string> = {};

    if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
      try {
        const renderPage = async (pageData: any) => {
          const textContent = await pageData.getTextContent();
          const annotations = await pageData.getAnnotations();
          
          let linkCount = 0;
          annotations.forEach((a: any) => {
            if (a.subtype === "Link" || (a.url && a.rect)) {
              const url = a.url || (a.action ? a.action.uri : null) || (a.dest ? a.dest : null);
              if (!url || typeof url !== "string") return;
              linkCount++;
              
              // Group all items by approximate Y coordinate (line)
              const lineMap = new Map<number, any[]>();
              textContent.items.forEach((item: any) => {
                const y = Math.round(item.transform[5]);
                // group within 3 points
                let foundY = y;
                for (const ky of lineMap.keys()) {
                  if (Math.abs(ky - y) <= 3) {
                    foundY = ky;
                    break;
                  }
                }
                if (!lineMap.has(foundY)) lineMap.set(foundY, []);
                lineMap.get(foundY)!.push(item);
              });

              // Convert to array of lines
              const lines: any[] = [];
              for (const [lineY, items] of lineMap.entries()) {
                items.sort((a: any, b: any) => a.transform[4] - b.transform[4]); // sort by X
                // Only include text items that fall roughly within the annotation's X bounds, OR use the whole line if the annotation is wide
                // Actually, if we just use the entire line's text, it's very robust because Gemini preserves the whole string.
                // But let's restrict it to text that overlaps the annotation horizontally to avoid grabbing unrelated columns.
                const overlappingItems = items.filter((i: any) => {
                  const ix = i.transform[4];
                  const iw = i.width || 0;
                  return (ix + iw >= a.rect[0] - 20) && (ix <= a.rect[2] + 20);
                });
                
                if (overlappingItems.length > 0) {
                  const lineText = overlappingItems.map((i: any) => i.str).join('').replace(/\s+/g, ' ').trim();
                  lines.push({ y: lineY, text: lineText, items: overlappingItems });
                }
              }

              // Find the line that is closest to the annotation's center Y
              const annotCenterY = (a.rect[1] + a.rect[3]) / 2;
              let closestLine: any = null;
              let minDiff = Infinity;
              
              lines.forEach(line => {
                const diff = Math.abs(line.y - annotCenterY);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestLine = line;
                }
              });

              if (closestLine && minDiff < 15) { // within a reasonable vertical distance
                const linkText = closestLine.text;
                if (linkText) {
                  linksMap[linkText] = url;
                }
              }
            }
          });
          
          console.log(`[PDF Parsing] Page ${pageData.pageNumber} - Found ${linkCount} link annotations.`);
          
          // Reconstruct text with newlines to help Gemini parse structure correctly
          const pageLines = new Map<number, any[]>();
          textContent.items.forEach((item: any) => {
            const y = Math.round(item.transform[5]);
            let foundY = y;
            for (const ky of pageLines.keys()) {
              if (Math.abs(ky - y) <= 4) {
                foundY = ky;
                break;
              }
            }
            if (!pageLines.has(foundY)) pageLines.set(foundY, []);
            pageLines.get(foundY)!.push(item);
          });
          
          // Sort lines by Y descending (PDF coordinates usually have Y=0 at bottom)
          const sortedY = Array.from(pageLines.keys()).sort((a, b) => b - a);
          
          const textWithNewlines = sortedY.map(y => {
            const items = pageLines.get(y)!;
            items.sort((a, b) => a.transform[4] - b.transform[4]);
            return items.map(i => i.str).join('').replace(/\s+/g, ' ').trim();
          }).join('\n');
          
          return textWithNewlines;
        };
        
        const pdfData = await pdfParse(buffer, { pagerender: renderPage });
        text = pdfData.text;
        styleProfile = await extractPdfStyles(buffer);
      } catch (e: any) {
        console.error("Actual PDF parsing error:", e);
        throw new Error("Failed to parse PDF: " + (e.message || "Unknown error"));
      }
    } else if (file.name.toLowerCase().endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      try {
        const rawResult = await mammoth.extractRawText({ buffer });
        text = rawResult.value;
        
        const htmlResult = await mammoth.convertToHtml({ buffer });
        const html = htmlResult.value;
        const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
          const url = match[1];
          const rawText = match[2].replace(/<[^>]+>/g, "").trim();
          if (rawText && url) {
            linksMap[rawText] = url;
          }
        }
        
        styleProfile = await extractDocxStyles(buffer);
      } catch (e: any) {
        throw new Error("Failed to parse DOCX file.");
      }
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload a .pdf or .docx file." }, { status: 400 });
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text. The file might be scanned or empty. Please paste your resume text instead." },
        { status: 400 }
      );
    }

    if (linksMap) {
      console.log(`[PDF/DOCX Parsing] Final Extracted Linked Entities Map:`, JSON.stringify(linksMap, null, 2));
    }

    return NextResponse.json({ 
      text: text.trim(),
      styleProfile,
      linksMap
    });
  } catch (error: any) {
    console.error("Error extracting text:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract text from file." },
      { status: 500 }
    );
  }
}

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

async function extractPdfStyles(buffer: Buffer) {
  try {
    const pdfString = buffer.toString('utf8');
    
    // Best-effort PDF color extraction by searching for the 'rg' (RGB fill) operator
    // Format: R G B rg  (values 0.0 to 1.0)
    const rgMatches = pdfString.match(/([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+rg/g) || [];
    const colorCounts: Record<string, number> = {};
    
    rgMatches.forEach(match => {
      const parts = match.split(/\s+/);
      if (parts.length >= 3) {
        const r = Math.round(parseFloat(parts[0]) * 255);
        const g = Math.round(parseFloat(parts[1]) * 255);
        const b = Math.round(parseFloat(parts[2]) * 255);
        
        // Convert to HEX
        const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        
        // Ignore black, white, and grays
        if (hex !== "000000" && hex !== "FFFFFF" && Math.abs(r - g) > 10 && Math.abs(g - b) > 10) {
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }
      }
    });
    
    const sortedColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
    const headingColor = sortedColors.length > 0 ? sortedColors[0] : null;

    return {
      headingColor,
      headingFont: null, // Hard to extract reliably without full font table parsing
      bodyFont: null
    };
  } catch (e) {
    console.error("Failed to extract PDF styles:", e);
    return null;
  }
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

    if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
      try {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
        styleProfile = await extractPdfStyles(buffer);
      } catch (e: any) {
        console.error("Actual PDF parsing error:", e);
        throw new Error("Failed to parse PDF: " + (e.message || "Unknown error"));
      }
    } else if (file.name.toLowerCase().endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
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

    return NextResponse.json({ 
      text: text.trim(),
      styleProfile 
    });
  } catch (error: any) {
    console.error("Error extracting text:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract text from file." },
      { status: 500 }
    );
  }
}

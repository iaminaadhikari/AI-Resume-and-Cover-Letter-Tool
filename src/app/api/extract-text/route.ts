import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

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

    if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
      try {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } catch (e: any) {
        throw new Error("Failed to parse PDF. It might be scanned or image-only.");
      }
    } else if (file.name.toLowerCase().endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
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

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error("Error extracting text:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract text from file." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Schema, Type } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tailored_resume: {
      type: Type.STRING,
      description: "The full rewritten, tailored resume (formatted and readable).",
    },
    cover_letter: {
      type: Type.STRING,
      description: "A matching cover letter draft.",
    },
    changes_summary: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "A short 'What Changed' summary — 3 to 5 bullet points explaining the key edits made and why.",
    },
  },
  required: ["tailored_resume", "cover_letter", "changes_summary"],
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API Key is missing. Please set GEMINI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { originalResume, jobDescription } = body;

    if (!originalResume || !jobDescription) {
      return NextResponse.json(
        { error: "Both originalResume and jobDescription are required." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are an expert technical recruiter and resume writer. 
Your task is to tailor a user's existing resume to a specific job description.

CRITICAL RULE: You must ONLY rephrase, reorganize, and re-emphasize content that already exists in the user's original resume. 
You must NEVER invent, fabricate, or hallucinate skills, tools, employers, metrics, or achievements that were not present in the original input.
This is a strict safety constraint. Do not add anything new. Only reframe what is there to better match the job description.`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const prompt = `Please tailor my resume for the following job description.

--- ORIGINAL RESUME ---
${originalResume}

--- JOB DESCRIPTION ---
${jobDescription}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse the JSON output
    const jsonOutput = JSON.parse(text);

    return NextResponse.json(jsonOutput);
  } catch (error: any) {
    console.error("Error generating tailored resume:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate tailored resume." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    tailored_resume: {
      type: SchemaType.OBJECT,
      description: "The full rewritten, tailored resume formatted as a structured object.",
      properties: {
        name: { type: SchemaType.STRING },
        contact_info: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "List of contact details (e.g. location, phone, email, LinkedIn).",
        },
        summary: { type: SchemaType.STRING },
        skills: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              category: { type: SchemaType.STRING, description: "E.g., Languages, Frameworks, Tools" },
              items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["category", "items"]
          }
        },
        experience: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              company: { type: SchemaType.STRING },
              location: { type: SchemaType.STRING },
              dates: { type: SchemaType.STRING },
              bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["title", "company", "dates", "bullets"]
          }
        },
        education: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              degree: { type: SchemaType.STRING },
              institution: { type: SchemaType.STRING },
              location: { type: SchemaType.STRING },
              dates: { type: SchemaType.STRING },
              details: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Optional honors, GPA, etc." }
            },
            required: ["degree", "institution", "dates"]
          }
        },
        projects: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              technologies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              dates: { type: SchemaType.STRING },
              bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["name", "bullets"]
          }
        }
      },
      required: ["name", "contact_info", "experience", "education"]
    },
    cover_letter: {
      type: SchemaType.STRING,
      description: "A matching cover letter draft.",
    },
    changes_summary: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
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

    const prompt = `Please tailor my resume for the following job description. Ensure the output is formatted according to the schema.

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

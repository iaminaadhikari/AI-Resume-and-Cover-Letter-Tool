"use client";

import React, { useState, useEffect } from "react";
import { Copy, Download, Loader2, Sparkles, ChevronRight } from "lucide-react";
import PaywallModal from "@/components/PaywallModal";

interface StructuredResume {
  name: string;
  contact_info: string[];
  summary?: string;
  skills?: { category: string; items: string[] }[];
  experience: {
    title: string;
    company: string;
    location?: string;
    dates: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    location?: string;
    dates: string;
    details?: string[];
  }[];
  projects?: {
    name: string;
    technologies?: string[];
    dates?: string;
    bullets: string[];
  }[];
}

export default function Home() {
  const [originalResume, setOriginalResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [result, setResult] = useState<{
    tailored_resume: StructuredResume;
    cover_letter: string;
    changes_summary: string[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"resume" | "cover_letter" | "changes">("resume");
  
  // Usage tracking
  const [freeUsesRemaining, setFreeUsesRemaining] = useState<number>(2);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  useEffect(() => {
    // Load usage from localStorage on mount
    const storedUses = localStorage.getItem("resume_tool_free_uses");
    if (storedUses !== null) {
      setFreeUsesRemaining(parseInt(storedUses, 10));
    } else {
      localStorage.setItem("resume_tool_free_uses", "2");
    }
  }, []);

  const handleTailor = async () => {
    setError("");
    
    if (!originalResume.trim() || !jobDescription.trim()) {
      setError("Please provide both your original resume and the job description.");
      return;
    }

    if (freeUsesRemaining <= 0) {
      setIsPaywallOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ originalResume, jobDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to tailor resume.");
      }

      const data = await response.json();
      setResult(data);
      
      // Decrement free uses
      const newUses = freeUsesRemaining - 1;
      setFreeUsesRemaining(newUses);
      localStorage.setItem("resume_tool_free_uses", newUses.toString());
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatResumeToText = (resume: StructuredResume): string => {
    let text = `${resume.name}\n`;
    text += `${resume.contact_info.join(" | ")}\n\n`;

    if (resume.summary) {
      text += `SUMMARY\n${resume.summary}\n\n`;
    }

    if (resume.skills && resume.skills.length > 0) {
      text += `TECHNICAL SKILLS\n`;
      resume.skills.forEach(skill => {
        text += `${skill.category}: ${skill.items.join(", ")}\n`;
      });
      text += `\n`;
    }

    if (resume.experience && resume.experience.length > 0) {
      text += `EXPERIENCE\n`;
      resume.experience.forEach(exp => {
        text += `${exp.title} | ${exp.company}${exp.location ? ` | ${exp.location}` : ""} | ${exp.dates}\n`;
        exp.bullets.forEach(bullet => {
          text += `- ${bullet}\n`;
        });
        text += `\n`;
      });
    }

    if (resume.education && resume.education.length > 0) {
      text += `EDUCATION\n`;
      resume.education.forEach(edu => {
        text += `${edu.degree} | ${edu.institution}${edu.location ? ` | ${edu.location}` : ""} | ${edu.dates}\n`;
        if (edu.details) {
          edu.details.forEach(detail => text += `- ${detail}\n`);
        }
      });
      text += `\n`;
    }

    if (resume.projects && resume.projects.length > 0) {
      text += `PROJECTS\n`;
      resume.projects.forEach(proj => {
        text += `${proj.name}${proj.technologies ? ` | ${proj.technologies.join(", ")}` : ""}${proj.dates ? ` | ${proj.dates}` : ""}\n`;
        proj.bullets.forEach(bullet => {
          text += `- ${bullet}\n`;
        });
        text += `\n`;
      });
    }

    return text.trim();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const downloadTxt = (text: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-5xl px-4 py-12 mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-4">
            Turn any resume into a perfect match for any job <br className="hidden md:block"/>
            <span className="text-blue-600 dark:text-blue-500">— in under a minute</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-zinc-600 dark:text-zinc-400">
            Stop manually rewriting your resume for every application. Paste your current resume and the job description, and we'll do the rest.
          </p>
        </div>

        {/* Inputs Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="flex flex-col">
            <label htmlFor="resume" className="mb-2 font-medium">1. Your Existing Resume</label>
            <textarea
              id="resume"
              value={originalResume}
              onChange={(e) => setOriginalResume(e.target.value)}
              placeholder="Paste your plain text resume here..."
              className="flex-1 min-h-[300px] p-4 border border-zinc-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="jd" className="mb-2 font-medium">2. Job Description</label>
            <textarea
              id="jd"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job posting requirements and details here..."
              className="flex-1 min-h-[300px] p-4 border border-zinc-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Action Button & Counter */}
        <div className="flex flex-col items-center justify-center mb-16">
          <button
            onClick={handleTailor}
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Tailoring...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Tailor My Resume
              </>
            )}
          </button>
          
          <div className="mt-4 text-sm text-zinc-500 font-medium">
            {freeUsesRemaining > 0 ? (
              <span>{freeUsesRemaining} of 2 free tailors remaining</span>
            ) : (
              <span className="text-orange-500">0 free tailors remaining. Upgrade to continue.</span>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="mt-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            
            {/* Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
              <button
                onClick={() => setActiveTab("resume")}
                className={`flex-1 py-4 px-6 font-medium text-center whitespace-nowrap transition-colors ${
                  activeTab === "resume" 
                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" 
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                Tailored Resume
              </button>
              <button
                onClick={() => setActiveTab("cover_letter")}
                className={`flex-1 py-4 px-6 font-medium text-center whitespace-nowrap transition-colors ${
                  activeTab === "cover_letter" 
                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" 
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                Cover Letter
              </button>
              <button
                onClick={() => setActiveTab("changes")}
                className={`flex-1 py-4 px-6 font-medium text-center whitespace-nowrap transition-colors ${
                  activeTab === "changes" 
                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" 
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                What Changed
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 md:p-8">
              {/* Copy/Download Actions */}
              <div className="flex justify-end gap-3 mb-6">
                {activeTab !== "changes" && (
                  <button
                    onClick={() => {
                      const text = activeTab === "resume" ? formatResumeToText(result.tailored_resume) : result.cover_letter;
                      downloadTxt(text, `${activeTab}.txt`);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                )}
                <button
                  onClick={() => {
                    const text = activeTab === "resume" 
                      ? formatResumeToText(result.tailored_resume)
                      : activeTab === "cover_letter" 
                        ? result.cover_letter 
                        : result.changes_summary.join("\n- ");
                    copyToClipboard(text);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>

              {/* Text Content */}
              <div className="text-zinc-800 dark:text-zinc-200 max-w-none">
                {activeTab === "resume" && (
                  <div className="font-sans">
                    {/* Header: Name and Contact Info */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold uppercase mb-2">{result.tailored_resume.name}</h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 flex flex-wrap justify-center gap-x-2 gap-y-1">
                        {result.tailored_resume.contact_info.map((info, idx) => (
                          <span key={idx}>
                            {info}
                            {idx < result.tailored_resume.contact_info.length - 1 && <span className="mx-2">|</span>}
                          </span>
                        ))}
                      </p>
                    </div>

                    {/* Summary */}
                    {result.tailored_resume.summary && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold uppercase text-blue-700 dark:text-blue-400 border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-3">Summary</h3>
                        <p className="text-sm leading-relaxed">{result.tailored_resume.summary}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {result.tailored_resume.skills && result.tailored_resume.skills.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold uppercase text-blue-700 dark:text-blue-400 border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-3">Technical Skills</h3>
                        <ul className="text-sm space-y-1">
                          {result.tailored_resume.skills.map((skill, idx) => (
                            <li key={idx}>
                              <span className="font-semibold">{skill.category}:</span> {skill.items.join(", ")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Experience */}
                    {result.tailored_resume.experience && result.tailored_resume.experience.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold uppercase text-blue-700 dark:text-blue-400 border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-3">Experience</h3>
                        <div className="space-y-4">
                          {result.tailored_resume.experience.map((exp, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-bold text-base">{exp.title}</h4>
                                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap ml-4">{exp.dates}</span>
                              </div>
                              <div className="text-sm font-medium italic mb-2">
                                {exp.company}{exp.location ? `, ${exp.location}` : ""}
                              </div>
                              <ul className="list-disc list-outside ml-4 space-y-1 text-sm">
                                {exp.bullets.map((bullet, bIdx) => (
                                  <li key={bIdx} className="pl-1">{bullet}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {result.tailored_resume.education && result.tailored_resume.education.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold uppercase text-blue-700 dark:text-blue-400 border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-3">Education</h3>
                        <div className="space-y-3">
                          {result.tailored_resume.education.map((edu, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-bold text-base">{edu.degree}</h4>
                                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap ml-4">{edu.dates}</span>
                              </div>
                              <div className="text-sm font-medium italic mb-1">
                                {edu.institution}{edu.location ? `, ${edu.location}` : ""}
                              </div>
                              {edu.details && edu.details.length > 0 && (
                                <ul className="list-disc list-outside ml-4 space-y-1 text-sm">
                                  {edu.details.map((detail, dIdx) => (
                                    <li key={dIdx} className="pl-1">{detail}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {result.tailored_resume.projects && result.tailored_resume.projects.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold uppercase text-blue-700 dark:text-blue-400 border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-3">Projects</h3>
                        <div className="space-y-4">
                          {result.tailored_resume.projects.map((proj, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-bold text-base">
                                  {proj.name}
                                  {proj.technologies && <span className="font-normal text-sm italic ml-2">| {proj.technologies.join(", ")}</span>}
                                </h4>
                                {proj.dates && <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap ml-4">{proj.dates}</span>}
                              </div>
                              <ul className="list-disc list-outside ml-4 space-y-1 text-sm mt-1">
                                {proj.bullets.map((bullet, bIdx) => (
                                  <li key={bIdx} className="pl-1">{bullet}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "cover_letter" && (
                  <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">
                    {result.cover_letter}
                  </pre>
                )}
                {activeTab === "changes" && (
                  <ul className="space-y-3">
                    {result.changes_summary.map((change, i) => (
                      <li key={i} className="flex gap-3 text-base">
                        <ChevronRight className="w-5 h-5 flex-shrink-0 text-blue-500 mt-0.5" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        {!result && (
          <div className="mt-24 mb-12">
            <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xl mb-4">1</div>
                <h3 className="font-semibold text-lg mb-2">Paste Content</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Paste your existing resume and the target job description.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xl mb-4">2</div>
                <h3 className="font-semibold text-lg mb-2">AI Optimization</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">We analyze the keywords and reframe your true experience to match the role.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xl mb-4">3</div>
                <h3 className="font-semibold text-lg mb-2">Apply & Win</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Download your tailored resume and cover letter, ready to submit.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} />
    </main>
  );
}

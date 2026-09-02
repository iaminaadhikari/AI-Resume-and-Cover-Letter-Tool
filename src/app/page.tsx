"use client";

import React, { useState, useEffect } from "react";
import { Copy, Download, Loader2, Sparkles, ChevronRight, Mail, Phone, Link, Code, MapPin } from "lucide-react";
import PaywallModal from "@/components/PaywallModal";
import { ThemeToggle } from "@/components/ThemeToggle";

interface StructuredResume {
  name: string;
  contact_info: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin_url?: string;
    github_url?: string;
  };
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
    url?: string;
    technologies?: string[];
    dates?: string;
    bullets: string[];
  }[];
  custom_sections?: {
    section_title: string;
    entries: {
      title: string;
      url?: string;
      subtitle?: string;
      dates?: string;
      bullets?: string[];
    }[];
  }[];
}

export default function Home() {
  const [originalResume, setOriginalResume] = useState("");
  const [linksMap, setLinksMap] = useState<Record<string, string>>({});
  const [styleProfile, setStyleProfile] = useState<any>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  const getContactIcon = (type: string) => {
    const iconProps = { className: "w-4 h-4 mr-1.5", style: { color: styleProfile?.headingColor ? `#${styleProfile.headingColor}` : undefined } };
    if (type === "email") return <Mail {...iconProps} />;
    if (type === "linkedin") return <Link {...iconProps} />;
    if (type === "github") return <Code {...iconProps} />;
    if (type === "phone") return <Phone {...iconProps} />;
    return <MapPin {...iconProps} />;
  };

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
      setError("Please provide both your original CV and the job description.");
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
        body: JSON.stringify({ originalResume, jobDescription, linksMap }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to tailor CV.");
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
    const c = resume.contact_info;
    const contactParts = [];
    if (c.email) contactParts.push(c.email);
    if (c.phone) contactParts.push(c.phone);
    if (c.location) contactParts.push(c.location);
    if (c.linkedin_url) contactParts.push(c.linkedin_url);
    if (c.github_url) contactParts.push(c.github_url);
    text += `${contactParts.join(" | ")}\n\n`;

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
        text += `${proj.name}${proj.url && proj.url !== "null" && proj.url.trim() !== "" ? ` (${proj.url})` : ""}${proj.technologies ? ` | ${proj.technologies.join(", ")}` : ""}${proj.dates ? ` | ${proj.dates}` : ""}\n`;
        proj.bullets.forEach(bullet => {
          text += `- ${bullet}\n`;
        });
        text += `\n`;
      });
    }

    if (resume.custom_sections && resume.custom_sections.length > 0) {
      resume.custom_sections.forEach(sec => {
        text += `${sec.section_title.toUpperCase()}\n`;
        sec.entries.forEach(entry => {
          text += `${entry.title}${entry.url && entry.url !== "null" && entry.url.trim() !== "" ? ` (${entry.url})` : ""}${entry.subtitle ? ` | ${entry.subtitle}` : ""}${entry.dates ? ` | ${entry.dates}` : ""}\n`;
          if (entry.bullets) {
            entry.bullets.forEach(bullet => {
              text += `- ${bullet}\n`;
            });
          }
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
    <main className="min-h-screen bg-[#F5F5FA] dark:bg-[#13151A] text-gray-800 dark:text-[#F1F1F3] transition-colors duration-200">
      <div className="max-w-5xl px-4 py-12 mx-auto sm:px-6 lg:px-8 relative">
        {/* Toggle */}
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-4 text-gray-900 dark:text-white drop-shadow-none" style={{ textShadow: "none", WebkitTextStroke: "0" }}>
            Turn any CV into a perfect match for any job <br className="hidden md:block"/>
            <span className="text-indigo-600 dark:text-indigo-400">— in under a minute</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400">
            Stop manually rewriting your CV for every application. Paste your current CV and the job description, and we'll do the rest.
          </p>
        </div>

        {/* Inputs Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="flex flex-col">
            <div className="flex justify-between items-end mb-2">
              <label htmlFor="resume" className="font-medium text-gray-500 dark:text-gray-400">1. Your Existing CV</label>
              <div className="relative">
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,.docx"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    setIsUploading(true);
                    setError("");
                    
                    const formData = new FormData();
                    formData.append("file", file);
                    
                    try {
                      const res = await fetch("/api/extract-text", {
                        method: "POST",
                        body: formData,
                      });
                      
                      let data;
                      try {
                        data = await res.json();
                      } catch (e) {
                        throw new Error(`Server returned ${res.status} ${res.statusText}. Please restart your dev server if this persists.`);
                      }
                      
                      if (!res.ok) throw new Error(data.error || "Failed to extract text");
                      
                      setOriginalResume(data.text);
                      if (data.linksMap) setLinksMap(data.linksMap);
                      if (data.styleProfile) {
                        setStyleProfile(data.styleProfile);
                      }
                    } catch (err: any) {
                      setError(err.message || "Failed to parse file. Please paste text instead.");
                    } finally {
                      setIsUploading(false);
                      e.target.value = '';
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <button
                  type="button"
                  disabled={isUploading}
                  className="text-xs font-medium px-3 py-1.5 bg-gray-100 dark:bg-[#2A2E37] text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 shadow-sm"
                >
                  {isUploading ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Extracting...</>
                  ) : (
                    <>Upload .pdf / .docx</>
                  )}
                </button>
              </div>
            </div>
            <textarea
              id="resume"
              value={originalResume}
              onChange={(e) => setOriginalResume(e.target.value)}
              placeholder="Paste your plain text CV here, or upload a file..."
              className="flex-1 min-h-[300px] p-4 border border-gray-200 dark:border-[#333945] rounded-xl bg-white dark:bg-[#20242D] focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 outline-none resize-y shadow-sm"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="jd" className="mb-2 font-medium text-gray-500 dark:text-gray-400">2. Job Description</label>
            <textarea
              id="jd"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job posting requirements and details here..."
              className="flex-1 min-h-[300px] p-4 border border-gray-200 dark:border-[#333945] rounded-xl bg-white dark:bg-[#20242D] focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 outline-none resize-y shadow-sm"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-center border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}

        {/* Action Button & Counter */}
        <div className="flex flex-col items-center justify-center mb-16">
          <button
            onClick={handleTailor}
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all bg-indigo-600 rounded-full hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Tailoring...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Tailor My CV
              </>
            )}
          </button>
          
          <div className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
            {freeUsesRemaining > 0 ? (
              <span>{freeUsesRemaining} of 2 free tailors remaining</span>
            ) : (
              <span className="text-orange-500 dark:text-orange-400">0 free tailors remaining. Upgrade to continue.</span>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="mt-8 border border-gray-200 dark:border-[#333945] rounded-2xl bg-white dark:bg-[#20242D] overflow-hidden shadow-sm">
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-[#333945] overflow-x-auto">
              <button
                onClick={() => setActiveTab("resume")}
                className={`flex-1 py-4 px-6 font-medium text-center whitespace-nowrap transition-colors ${
                  activeTab === "resume" 
                    ? "border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400" 
                    : "text-gray-500 dark:text-gray-500 border-b-2 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Tailored CV
              </button>
              <button
                onClick={() => setActiveTab("cover_letter")}
                className={`flex-1 py-4 px-6 font-medium text-center whitespace-nowrap transition-colors ${
                  activeTab === "cover_letter" 
                    ? "border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400" 
                    : "text-gray-500 dark:text-gray-500 border-b-2 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Cover Letter
              </button>
              <button
                onClick={() => setActiveTab("changes")}
                className={`flex-1 py-4 px-6 font-medium text-center whitespace-nowrap transition-colors ${
                  activeTab === "changes" 
                    ? "border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400" 
                    : "text-gray-500 dark:text-gray-500 border-b-2 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
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
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          let blob: Blob;
                          if (activeTab === "resume") {
                            const { generateResumeDocx } = await import("@/utils/docxGenerator");
                            blob = await generateResumeDocx(result.tailored_resume, styleProfile);
                          } else {
                            const { generateCoverLetterDocx } = await import("@/utils/docxGenerator");
                            blob = await generateCoverLetterDocx(result.cover_letter, styleProfile);
                          }
                          const url = URL.createObjectURL(blob);
                          const element = document.createElement("a");
                          element.href = url;
                          const filenameBase = activeTab === "resume" ? "CV" : activeTab === "cover_letter" ? "Cover_Letter" : "Changes";
                          element.download = `${filenameBase}.docx`;
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                          URL.revokeObjectURL(url);
                        } catch (err) {
                          console.error("Failed to generate DOCX:", err);
                          alert("Failed to generate DOCX file.");
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 dark:border-[#333945] text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-[#2A2E37] transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download .docx
                    </button>
                    <button
                      onClick={() => {
                        const text = activeTab === "resume" ? formatResumeToText(result.tailored_resume) : result.cover_letter;
                        const filenameBase = activeTab === "resume" ? "CV" : activeTab === "cover_letter" ? "Cover_Letter" : "Changes";
                        downloadTxt(text, `${filenameBase}.txt`);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 dark:border-[#333945] text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-[#2A2E37] transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download .txt
                    </button>
                  </div>
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
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 dark:border-[#333945] text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-[#2A2E37] transition-colors"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>

              {/* Text Content */}
              <div className="text-gray-800 dark:text-[#F1F1F3] max-w-none">
                {activeTab === "resume" && (
                  <div className="font-sans" style={{ fontFamily: styleProfile?.bodyFont || undefined }}>
                    {/* Header: Name and Contact Info */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold uppercase mb-2" style={{ color: styleProfile?.headingColor ? `#${styleProfile.headingColor}` : undefined, fontFamily: styleProfile?.headingFont || undefined }}>{result.tailored_resume.name}</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap justify-center gap-x-3 gap-y-2 mt-2">
                        {(() => {
                          const items = [];
                          const c = result.tailored_resume.contact_info;
                          if (c.email) items.push({ type: "email", text: c.email, url: `mailto:${c.email}` });
                          if (c.phone) items.push({ type: "phone", text: c.phone });
                          if (c.location) items.push({ type: "location", text: c.location });
                          if (c.linkedin_url) items.push({ type: "linkedin", text: "LinkedIn", url: c.linkedin_url });
                          if (c.github_url) items.push({ type: "github", text: "GitHub", url: c.github_url });
                          return items.map((item, idx) => (
                            <span key={idx} className="flex items-center">
                              {getContactIcon(item.type)}
                              {item.url && item.url !== "null" && item.url.trim() !== "" ? (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-600 dark:text-indigo-400" style={{ color: styleProfile?.headingColor ? `#${styleProfile.headingColor}` : undefined }}>
                                  {item.text}
                                </a>
                              ) : (
                                <span>{item.text}</span>
                              )}
                            </span>
                          ));
                        })()}
                      </p>
                    </div>

                    {/* Summary */}
                    {result.tailored_resume.summary && (
                      <div className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-gray-200 dark:border-[#333945] pb-1 mb-3" style={{ color: styleProfile?.headingColor ? `#${styleProfile.headingColor}` : undefined, fontFamily: styleProfile?.headingFont || undefined }}>Summary</h3>
                        <p className="text-sm leading-relaxed">{result.tailored_resume.summary}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {result.tailored_resume.skills && result.tailored_resume.skills.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-gray-200 dark:border-[#333945] pb-1 mb-3" style={{ color: styleProfile?.headingColor ? `#${styleProfile.headingColor}` : undefined, fontFamily: styleProfile?.headingFont || undefined }}>Technical Skills</h3>
                        <ul className="text-sm space-y-1">
                          {result.tailored_resume.skills.map((skill, idx) => (
                            <li key={idx}>
                              <span className="font-semibold">{skill.category}:</span> <span className="text-gray-700 dark:text-gray-300">{skill.items.join(", ")}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Experience */}
                    {result.tailored_resume.experience && result.tailored_resume.experience.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-gray-200 dark:border-[#333945] pb-1 mb-3" style={{ color: styleProfile?.headingColor ? `#${styleProfile.headingColor}` : undefined, fontFamily: styleProfile?.headingFont || undefined }}>Experience</h3>
                        <div className="space-y-4">
                          {result.tailored_resume.experience.map((exp, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-bold text-base">{exp.title}</h4>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">{exp.dates}</span>
                              </div>
                              <div className="text-sm font-medium italic mb-2 text-gray-700 dark:text-gray-300">
                                {exp.company}{exp.location ? `, ${exp.location}` : ""}
                              </div>
                              <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-gray-700 dark:text-gray-300">
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
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-gray-200 dark:border-[#333945] pb-1 mb-3" style={{ color: styleProfile?.headingColor ? `#${styleProfile.headingColor}` : undefined, fontFamily: styleProfile?.headingFont || undefined }}>Education</h3>
                        <div className="space-y-3">
                          {result.tailored_resume.education.map((edu, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-bold text-base">{edu.degree}</h4>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">{edu.dates}</span>
                              </div>
                              <div className="text-sm font-medium italic mb-1 text-gray-700 dark:text-gray-300">
                                {edu.institution}{edu.location ? `, ${edu.location}` : ""}
                              </div>
                              {edu.details && edu.details.length > 0 && (
                                <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-gray-700 dark:text-gray-300">
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
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-gray-200 dark:border-[#333945] pb-1 mb-3" style={{ color: styleProfile?.headingColor ? `#${styleProfile.headingColor}` : undefined, fontFamily: styleProfile?.headingFont || undefined }}>Projects</h3>
                        <div className="space-y-4">
                          {result.tailored_resume.projects.map((proj, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-bold text-base">
                                  {proj.url && proj.url !== "null" && proj.url.trim() !== "" ? (
                                    <a href={proj.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-600 dark:text-indigo-400" style={{ color: styleProfile?.headingColor ? `#${styleProfile.headingColor}` : undefined }}>
                                      {proj.name}
                                    </a>
                                  ) : proj.name}
                                  {proj.technologies && <span className="font-normal text-sm italic ml-2 text-gray-600 dark:text-gray-400">| {proj.technologies.join(", ")}</span>}
                                </h4>
                                {proj.dates && <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">{proj.dates}</span>}
                              </div>
                              <ul className="list-disc list-outside ml-4 space-y-1 text-sm mt-1 text-gray-700 dark:text-gray-300">
                                {proj.bullets.map((bullet, bIdx) => (
                                  <li key={bIdx} className="pl-1">{bullet}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Sections */}
                    {result.tailored_resume.custom_sections && result.tailored_resume.custom_sections.length > 0 && (
                      <div className="mb-6">
                        {result.tailored_resume.custom_sections.map((sec, secIdx) => (
                          <div key={secIdx} className="mb-6 last:mb-0">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-gray-200 dark:border-[#333945] pb-1 mb-3" style={{ color: styleProfile?.headingColor ? `#${styleProfile.headingColor}` : undefined, fontFamily: styleProfile?.headingFont || undefined }}>{sec.section_title}</h3>
                            <div className="space-y-4">
                              {sec.entries.map((entry, idx) => (
                                <div key={idx}>
                                  <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="font-bold text-base">
                                      {entry.url && entry.url !== "null" && entry.url.trim() !== "" ? (
                                        <a href={entry.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-600 dark:text-indigo-400" style={{ color: styleProfile?.headingColor ? `#${styleProfile.headingColor}` : undefined }}>
                                          {entry.title}
                                        </a>
                                      ) : entry.title}
                                      {entry.subtitle && <span className="font-normal text-sm ml-2 text-gray-700 dark:text-gray-300">| {entry.subtitle}</span>}
                                    </h4>
                                    {entry.dates && <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">{entry.dates}</span>}
                                  </div>
                                  {entry.bullets && entry.bullets.length > 0 && (
                                    <ul className="list-disc list-outside ml-4 space-y-1 text-sm mt-1 text-gray-700 dark:text-gray-300">
                                      {entry.bullets.map((bullet, bIdx) => (
                                        <li key={bIdx} className="pl-1">{bullet}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "cover_letter" && (
                  <div className="font-sans text-base leading-relaxed space-y-6">
                    {result.cover_letter.split(/\n\s*\n/).filter(Boolean).map((para, i) => (
                      <p key={i}>{para.trim()}</p>
                    ))}
                  </div>
                )}
                {activeTab === "changes" && (
                  <ul className="space-y-3">
                    {result.changes_summary.map((change, i) => (
                      <li key={i} className="flex gap-3 text-base">
                        <ChevronRight className="w-5 h-5 flex-shrink-0 text-indigo-500 mt-0.5" />
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
            <h2 className="text-2xl font-bold text-center mb-12 text-gray-900 dark:text-white">How it works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xl mb-4">1</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Paste Content</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Paste your existing CV and the target job description.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xl mb-4">2</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">AI Optimization</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">We analyze the keywords and reframe your true experience to match the role.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xl mb-4">3</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Apply & Win</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Download your tailored CV and cover letter, ready to submit.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} />
    </main>
  );
}

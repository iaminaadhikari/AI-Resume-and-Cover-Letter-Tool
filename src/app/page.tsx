"use client";

import React, { useState, useEffect } from "react";
import { Copy, Download, Loader2, Sparkles, FileText, ChevronRight } from "lucide-react";
import PaywallModal from "@/components/PaywallModal";

export default function Home() {
  const [originalResume, setOriginalResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [result, setResult] = useState<{
    tailored_resume: string;
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here in a fuller implementation
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
              <div className="flex justify-end gap-3 mb-4">
                {activeTab !== "changes" && (
                  <button
                    onClick={() => downloadTxt(activeTab === "resume" ? result.tailored_resume : result.cover_letter, `${activeTab}.txt`)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                )}
                <button
                  onClick={() => {
                    const text = activeTab === "resume" 
                      ? result.tailored_resume 
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
              <div className="prose dark:prose-invert max-w-none">
                {activeTab === "resume" && (
                  <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {result.tailored_resume}
                  </pre>
                )}
                {activeTab === "cover_letter" && (
                  <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {result.cover_letter}
                  </pre>
                )}
                {activeTab === "changes" && (
                  <ul className="space-y-3">
                    {result.changes_summary.map((change, i) => (
                      <li key={i} className="flex gap-3">
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

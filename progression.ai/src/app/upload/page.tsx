"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, Lock, Zap, ArrowRight } from "lucide-react";
import SetupProgressBar from "../../components/SetupProgressBar";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    setError(null);
    setFile(accepted[0] ?? null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 5 * 1024 * 1024,
  });

  // Poll for parsing status
  useEffect(() => {
    if (!resumeId || !parsing) return;
    
    let timer: any;
    async function poll() {
      try {
        const res = await fetch(`/api/resume/${resumeId}/status`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch status");
        
        setParsingProgress(data.progress);
        
        if (data.status === "completed") {
          clearInterval(timer);
          setParsing(false);
          // Redirect to review page
          setTimeout(() => router.push(`/resume/${resumeId}/review`), 800);
        }
        if (data.status === "failed") {
          clearInterval(timer);
          setParsing(false);
          setError(data.error || "Parsing failed");
        }
      } catch (e: any) {
        setError(e.message);
        clearInterval(timer);
        setParsing(false);
      }
    }
    
    poll();
    timer = setInterval(poll, 2000);
    return () => clearInterval(timer);
  }, [resumeId, parsing, router]);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await axios.post("/api/resume/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      if (res.data?.resumeId) {
        // Start parsing on the same page
        setResumeId(res.data.resumeId);
        setParsing(true);
        setParsingProgress(20);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/circular logo.png" 
            alt="Progression" 
            width={32} 
            height={32}
            className="rounded-full"
          />
          <span className="text-xl font-semibold text-[#007A33]">Progression</span>
        </Link>
      </header>

      <SetupProgressBar currentStep={1} totalSteps={3} />

      <main className="max-w-4xl mx-auto px-6 pt-12 pb-20">
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-medium bg-[#007A33]/10 text-[#007A33] px-3 py-1 rounded-full border border-[#007A33]/20 mb-6">
            <Zap className="h-3 w-3" />
            AI-Powered Resume Analysis
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black mb-4">
            Upload Your Resume
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get your career quantified in under a minute. We'll extract your skills, experience, and achievements to build your professional profile.
          </p>
        </section>

        <section className="space-y-6">
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? "border-[#007A33] bg-[#007A33]/5 scale-[1.02]"
                : file
                ? "border-[#007A33] bg-gray-50"
                : "border-gray-300 hover:border-[#007A33]/50 hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              {file ? (
                <>
                  <div className="h-16 w-16 rounded-full bg-[#007A33]/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-[#007A33]" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-black">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{Math.round(file.size / 1024)} KB</p>
                  </div>
                  <p className="text-sm text-gray-600">Click to select a different file</p>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-full bg-[#007A33]/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-[#007A33]" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-black mb-2">
                      {isDragActive ? "Drop your resume here" : "Drag & drop your resume"}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      or click to browse
                    </p>
                    <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                      <FileText className="h-3 w-3" />
                      PDF, DOC, or DOCX (max 5MB)
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {uploading && (
            <div className="space-y-3 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">
                  {uploadProgress < 30 ? "Uploading your resume..." :
                   uploadProgress < 70 ? "Transferring file securely..." :
                   "Upload complete, preparing to analyze..."}
                </span>
                <span className="text-[#007A33] font-semibold">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {parsing && (
            <div className="space-y-3 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">
                  {parsingProgress < 30 ? "Reading document structure..." : 
                   parsingProgress < 45 ? "Analyzing education history..." :
                   parsingProgress < 60 ? "Parsing work experiences..." :
                   parsingProgress < 75 ? "Extracting skills and certifications..." :
                   parsingProgress < 90 ? "Identifying key achievements..." :
                   parsingProgress < 100 ? "Finalizing your profile..." :
                   "Processing complete!"}
                </span>
                <span className="text-[#007A33] font-semibold">{parsingProgress}%</span>
              </div>
              <Progress value={parsingProgress} className="h-2" />
              {parsingProgress === 100 && (
                <p className="text-sm text-green-600 font-medium">Completed! Redirecting to review...</p>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading || parsing}
              className="flex-1 h-14 text-base font-semibold rounded-full bg-[#007A33] text-white hover:bg-[#006628] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Uploading...
                </span>
              ) : parsing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  Process My Resume
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-[#007A33] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-black">Secure & Private</p>
                <p className="text-xs text-gray-600">Your resume is encrypted and stored securely</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-[#007A33] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-black">Fast Processing</p>
                <p className="text-xs text-gray-600">Get your profile in under a minute</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#007A33] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-black">AI-Powered</p>
                <p className="text-xs text-gray-600">Advanced extraction and analysis</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}



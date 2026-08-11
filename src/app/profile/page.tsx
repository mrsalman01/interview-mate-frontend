"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage("");
    }
  };

 const handleUpload = async () => {
  if (!file) return;

  setUploading(true);
  setMessage("");

  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("resume", file);

  try {
    const response = await fetch("/api/resume/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    setMessage("Resume uploaded successfully! Redirecting...");
    setFile(null);

    // Naya: 1.5 second wait karo, phir automatically wapas bhej do
    setTimeout(() => {
      router.push("/");
    }, 1500);
  } catch {
    setMessage("Something went wrong. Please try again.");
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/60 backdrop-blur-lg border border-blue-900/40 p-8 rounded-2xl shadow-2xl">
          <button
            onClick={() => router.push("/")}
            className="text-blue-300 text-sm mb-4 hover:text-white transition-colors"
          >
            ← Back to Interviews
          </button>

          <h1 className="text-2xl font-bold text-white mb-2">Upload Resume</h1>
          <p className="text-blue-300 text-sm mb-6">
            Upload your resume so InterviewMate can ask you personalized questions.
          </p>

          {message && (
            <div className="bg-blue-500/10 border border-blue-500/30 text-blue-200 text-sm rounded-lg p-3 mb-4">
              {message}
            </div>
          )}

          <label className="block border-2 border-dashed border-blue-800/50 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-4xl mb-2">📄</div>
            <p className="text-blue-200 text-sm">
              {file ? file.name : "Click to select a PDF"}
            </p>
          </label>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {uploading ? "Uploading..." : "Upload Resume"}
          </button>
        </div>
      </div>
    </div>
  );
}
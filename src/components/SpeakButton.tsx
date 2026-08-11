"use client";

import { useState } from "react";

interface SpeakButtonProps {
  text: string;
}

export default function SpeakButton({ text }: SpeakButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Markdown symbols hata do taake awaaz mein "asterisk asterisk" na bole
    const cleanText = text.replace(/[*#_`]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <button
      onClick={handleSpeak}
      type="button"
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
        isSpeaking
          ? "bg-blue-500/20 text-blue-200 border border-blue-500/40"
          : "text-blue-300/50 hover:text-blue-200 hover:bg-slate-800/60 border border-transparent"
      }`}
    >
      {isSpeaking ? (
        <>
          <span className="flex gap-0.5 items-end h-3">
            <span className="w-0.5 bg-blue-300 animate-[bounce_0.6s_infinite] h-2"></span>
            <span className="w-0.5 bg-blue-300 animate-[bounce_0.6s_infinite_0.15s] h-3"></span>
            <span className="w-0.5 bg-blue-300 animate-[bounce_0.6s_infinite_0.3s] h-1.5"></span>
          </span>
          <span>Speaking</span>
        </>
      ) : (
        <>
          <span>🔊</span>
          <span>Listen</span>
        </>
      )}
    </button>
  );
}

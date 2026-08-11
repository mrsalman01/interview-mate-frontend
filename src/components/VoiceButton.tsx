"use client";

import { useState, useRef } from "react";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
}

export default function VoiceButton({ onTranscript }: VoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startRecording = () => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`relative w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
        isRecording
          ? "bg-red-500 shadow-lg shadow-red-500/40 scale-105"
          : "bg-slate-800/80 border border-blue-800/40 hover:border-blue-500/60 hover:bg-slate-700/80"
      }`}
      title={isRecording ? "Stop recording" : "Start voice input"}
    >
      {isRecording && (
        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50"></span>
      )}
      <span className="relative text-lg">
        {isRecording ? (
          <span className="block w-3 h-3 bg-white rounded-sm"></span>
        ) : (
          "🎤"
        )}
      </span>
    </button>
  );
}

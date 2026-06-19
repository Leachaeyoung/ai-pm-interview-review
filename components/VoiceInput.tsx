'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceInputProps {
  onTextChange: (text: string) => void;
  text: string;
}

export default function VoiceInput({ onTextChange, text }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [browserSupport, setBrowserSupport] = useState(true);
  const recognitionRef = useRef<any>(null);
  const textRef = useRef(text);
  textRef.current = text;
  const onTextChangeRef = useRef(onTextChange);
  onTextChangeRef.current = onTextChange;

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupport(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        onTextChangeRef.current(textRef.current + final);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }, [isRecording]);

  if (!browserSupport) {
    return null;
  }

  return (
    <button
      onClick={toggleRecording}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${
        isRecording
          ? 'border-red-700 bg-red-900/30 text-red-300 animate-pulse'
          : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-500'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-400' : 'bg-neutral-500'}`} />
      {isRecording ? '● 录音中' : '🎤 语音输入'}
    </button>
  );
}

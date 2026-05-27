import React, { useState } from 'react';
import { Mic, X } from 'lucide-react';

interface VoiceInputProps {
  onResult: (text: string) => void;
}

export default function VoiceInput({ onResult }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition não suportado neste navegador');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(transcript);
          onResult(transcript);
        } else {
          interimTranscript += transcript;
        }
      }
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={startListening}
        disabled={isListening}
        className={`p-2 rounded-full ${
          isListening
            ? 'bg-red-500 animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition-all`}
        title="Falar observação"
      >
        <Mic className="w-5 h-5" />
      </button>

      {transcript && (
        <div className="flex gap-1 items-center">
          <span className="text-sm text-gray-700 dark:text-gray-300">{transcript}</span>
          <button
            onClick={() => setTranscript('')}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

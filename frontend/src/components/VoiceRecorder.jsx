import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Check, Trash2 } from 'lucide-react';

function VoiceRecorder({ data, onChange }) {
  const [language, setLanguage] = useState(data?.language || 'en-IN');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(data?.transcript || '');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDone = () => {
    onChange({ language, transcript });
  };

  const handleClear = () => {
    setTranscript('');
    onChange({ language, transcript: '' });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const languages = [
    { code: 'en-IN', name: 'English' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'mr-IN', name: 'Marathi' },
    { code: 'ta-IN', name: 'Tamil' },
    { code: 'te-IN', name: 'Telugu' },
    { code: 'bn-IN', name: 'Bengali' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Describe Symptoms</h2>
        <p className="text-gray-600">Record voice or type symptoms in any language</p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isRecording}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      {isSupported && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isRecording 
                ? 'bg-emergency-red text-white animate-pulse' 
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {isRecording ? (
              <Square className="w-12 h-12" />
            ) : transcript ? (
              <Check className="w-12 h-12" />
            ) : (
              <Mic className="w-12 h-12" />
            )}
          </button>

          {isRecording && (
            <div className="text-2xl font-mono font-bold text-emergency-red">
              {formatTime(recordingTime)}
            </div>
          )}

          <div className="flex items-center gap-2 bg-aws-orange/10 px-3 py-1.5 rounded-full">
            <span className="text-sm font-medium text-aws-orange">AWS Transcribe</span>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          {isSupported ? 'Transcript (editable)' : 'Type symptoms here'}
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Symptoms will appear here... or type directly"
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleClear}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          Clear
        </button>
        <button
          onClick={handleDone}
          disabled={!transcript.trim()}
          className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Done
        </button>
      </div>
    </div>
  );
}

export default VoiceRecorder;


"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Loader2, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import DisclaimerDialog from "./DisclaimerDialog";
import { therapyConversation } from "@/ai/flows/therapy-conversation";
import type { MessageData } from 'genkit/ai';

type TranscriptItem = {
  speaker: "user" | "ai";
  text: string;
};

// A state machine to manage the session's flow and prevent race conditions.
type SessionState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function TherapySession() {
  const [isMounted, setIsMounted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [history, setHistory] = useState<MessageData[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const [voice, setVoice] = useState('Algenib');

  const aiAvatar = PlaceHolderImages.find((p) => p.id === "therapy-session-ai");

  // --- Client-side Initialization ---
  useEffect(() => {
    setIsMounted(true);
    audioRef.current = new Audio();
    const savedVoice = localStorage.getItem('aiVoice') || 'Algenib';
    setVoice(savedVoice);
  }, []);

  const playAudio = useCallback((audioDataUri: string) => {
    if (audioRef.current) {
      setSessionState('speaking');
      audioRef.current.src = audioDataUri;
      
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error("Error playing audio:", error);
            // If play fails, go back to idle to allow user to try again.
            setSessionState('idle');
        });
      }

      audioRef.current.onended = () => {
        // After audio finishes, go back to idle state.
        setSessionState('idle');
      };
      
      audioRef.current.onerror = (e) => {
          console.error("Audio element error:", e);
          setSessionState('idle');
      };
    }
  }, []);


  const handleSpeech = useCallback(async (text: string) => {
    if (!text) {
        setSessionState('idle'); // Nothing was said, go back to idle.
        return;
    }

    setSessionState('thinking'); // Move to thinking state while waiting for AI.

    const userMessage: TranscriptItem = { speaker: "user", text };
    setTranscript((prev) => [...prev, userMessage]);

    const currentHistory: MessageData[] = [...history, { role: 'user', content: [{ text }] }];
    setHistory(currentHistory);
    
    try {
      const result = await therapyConversation({ history: currentHistory, message: text, voiceName: voice });
      const aiMessage: TranscriptItem = { speaker: "ai", text: result.response };
      
      setTranscript((prev) => [...prev, aiMessage]);
      setHistory((prev) => [...prev, { role: 'model', content: [{ text: result.response }] }]);

      const isCrisisResponse = result.response.includes("988");
      
      if (result.audio && !isCrisisResponse) {
        playAudio(result.audio);
      } else {
        // If there's no audio (e.g., TTS failed) or it's a crisis response, just go to idle state.
        setSessionState('idle');
      }

    } catch (error) {
      console.error("Error with therapy conversation flow:", error);
      const errorMessage = "I'm having a little trouble connecting right now. Please give me a moment.";
      const aiMessage: TranscriptItem = { speaker: "ai", text: errorMessage };
      setTranscript((prev) => [...prev, aiMessage]);
      setHistory((prev) => [...prev, { role: 'model', content: [{text: errorMessage}] }]);
      setSessionState('idle'); // Go to idle state on error.
    }
  }, [history, voice, playAudio]);


  // --- Initial Greeting ---
  useEffect(() => {
    if (!showDisclaimer && history.length === 0 && sessionState === 'idle') {
      const initialGreeting = "Hello, I'm Bud. I'm here to listen. How are you feeling today?";
      
       (async () => {
          setSessionState('thinking'); // AI is preparing to 'speak' the greeting
          try {
            const result = await therapyConversation({ history: [], message: "", voiceName: voice });
            const aiMessage: TranscriptItem = { speaker: "ai", text: result.response };
            
            setTranscript((prev) => [...prev, aiMessage]);
            setHistory((prev) => [...prev, { role: 'model', content: [{ text: result.response }] }]);
            
            if (result.audio) {
              playAudio(result.audio);
            } else {
              setSessionState('idle');
            }
          } catch(e) {
            console.error("Failed to generate initial greeting", e);
             const aiMessage: TranscriptItem = { speaker: "ai", text: initialGreeting };
            setTranscript([aiMessage]);
            setHistory([{ role: 'model', content: [{ text: initialGreeting }] }]);
            setSessionState('idle');
          }
      })();
    }
  }, [showDisclaimer, history.length, voice, playAudio]);


  // --- Speech Recognition Setup ---
  useEffect(() => {
    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window)) {
      console.log("Speech recognition not supported");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
    }
    const recognition = recognitionRef.current;
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
        if (sessionState !== 'listening') setSessionState('listening');
    };
    
    recognition.onend = () => {
      // Only set to idle if we were in the listening state.
      // This prevents onend from interfering when we are thinking or speaking.
      if (sessionState === 'listening') {
        setSessionState('idle');
      }
    };
    
    recognition.onerror = (event) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
            console.error("Speech recognition error:", event.error);
        }
        if (sessionState === 'listening') {
            setSessionState('idle');
        }
    };
    
    recognition.onresult = (event) => {
        const finalTranscript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        if (finalTranscript.trim()) {
            handleSpeech(finalTranscript.trim());
        } else {
            setSessionState('idle');
        }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if(audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [handleSpeech, sessionState]);

  const toggleListen = () => {
    if (sessionState === 'listening') {
      recognitionRef.current?.stop();
    } else if (sessionState === 'idle') {
      recognitionRef.current?.start();
    }
  };

  const handleDisclaimerAgree = () => {
      setShowDisclaimer(false);
      setSessionState('idle');
  }

  const getStatusContent = () => {
    switch (sessionState) {
        case 'listening':
            return <p>Listening...</p>;
        case 'thinking':
            return <div className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 animate-pulse" /> AI is thinking...</div>;
        case 'speaking':
            return <p>AI is speaking...</p>;
        case 'idle':
        default:
            return <p>Tap mic to speak</p>;
    }
  };

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (showDisclaimer) {
    return <DisclaimerDialog onAgree={handleDisclaimerAgree} />;
  }

  const isMicButtonDisabled = sessionState === 'speaking' || sessionState === 'thinking';
  const lastMessage = transcript.length > 0 ? transcript[transcript.length-1] : null;
  
  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 text-white">
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
        <div className={cn("absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30", sessionState === 'speaking' && 'animate-pulse')}/>
        <div className={cn("w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 transition-all duration-500", sessionState === 'speaking' ? 'border-primary shadow-[0_0_30px] shadow-primary/50' : 'border-gray-600')}>
            {aiAvatar && (
                <video 
                    src={aiAvatar.imageUrl} 
                    data-ai-hint={aiAvatar.imageHint} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                />
            )}
        </div>
        <h2 className="text-2xl font-bold mt-6 font-headline">Bud AI</h2>
        <p className="text-gray-300">Session in progress...</p>
        <div className="mt-8 text-lg text-gray-200 h-20 flex items-center justify-center">
           {getStatusContent()}
        </div>

        <div className="absolute bottom-32 left-4 right-4 text-center max-h-48 overflow-y-auto">
            {lastMessage && (
              <p className={cn(
                  "text-xl transition-opacity duration-300",
                  lastMessage.speaker === 'ai' && lastMessage.text.includes("988") ? "text-destructive font-semibold" :
                  lastMessage.speaker === 'ai' ? "text-primary/90" : "text-white"
              )}>
                "{lastMessage.text}"
              </p>
            )}
        </div>

      </div>
      <div className="bg-black/50 p-6 flex justify-center items-center gap-8">
        <Button 
            onClick={toggleListen} 
            size="lg" 
            className={cn(
                "rounded-full w-20 h-20 transition-all duration-300 shadow-lg",
                 sessionState === 'listening' 
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-primary",
                 isMicButtonDisabled && "bg-gray-700 opacity-50 cursor-not-allowed"
            )}
            disabled={isMicButtonDisabled}
        >
            {sessionState === 'listening' ? <MicOff className="h-8 w-8"/> : <Mic className="h-8 w-8"/>}
        </Button>
        <Button onClick={() => router.push('/dashboard')} size="lg" variant="destructive" className="rounded-full w-20 h-20">
            <PhoneOff className="h-8 w-8"/>
        </Button>
      </div>
    </div>
  );
}

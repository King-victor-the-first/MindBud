
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
    return new Promise<void>((resolve) => {
        if (audioRef.current) {
            setSessionState('speaking');
            audioRef.current.src = audioDataUri;
            
            audioRef.current.onended = () => {
                setSessionState('idle');
                resolve();
            };
            
            audioRef.current.onerror = (e) => {
                console.error("Audio element error:", e);
                setSessionState('idle');
                resolve();
            };

            const playPromise = audioRef.current.play();
            if (playPromise) {
                playPromise.catch(error => {
                    console.error("Error playing audio:", error);
                    setSessionState('idle');
                    resolve();
                });
            } else {
                 setSessionState('idle');
                 resolve();
            }
        } else {
            setSessionState('idle');
            resolve();
        }
    });
  }, []);


  const handleSpeech = useCallback(async (text: string) => {
    if (!text) {
        setSessionState('idle');
        return;
    }

    setSessionState('thinking');

    const userMessage: TranscriptItem = { speaker: "user", text };
    setTranscript((prev) => [...prev, userMessage]);
    
    const newHistory: MessageData[] = [...history, { role: 'user', content: [{ text }] }];
    setHistory(newHistory);
    
    try {
      const result = await therapyConversation({ history: newHistory, message: text, voiceName: voice });
      const aiMessage: TranscriptItem = { speaker: "ai", text: result.response };
      
      setTranscript((prev) => [...prev, aiMessage]);
      setHistory((prev) => [...prev, { role: 'model', content: [{ text: result.response }] }]);
      
      const isCrisisResponse = result.response.includes("988");

      if (result.audio && !isCrisisResponse) {
        await playAudio(result.audio);
      } else {
        setSessionState('idle');
      }

    } catch (error) {
      console.error("Error with therapy conversation flow:", error);
      const errorMessage = "I'm having a little trouble connecting right now. Please give me a moment.";
      const aiMessage: TranscriptItem = { speaker: "ai", text: errorMessage };
      setTranscript((prev) => [...prev, aiMessage]);
      setHistory((prev) => [...prev, { role: 'model', content: [{text: errorMessage}] }]);
      setSessionState('idle');
    }
  }, [history, voice, playAudio]);


  // --- Initial Greeting ---
  useEffect(() => {
    if (!showDisclaimer && history.length === 0 && sessionState === 'idle') {
      const initialGreeting = "Hello, I'm Bud. I'm here to listen. How are you feeling today?";
      
       (async () => {
          setSessionState('thinking');
          try {
            const result = await therapyConversation({ history: [], message: "", voiceName: voice });
            const aiMessage: TranscriptItem = { speaker: "ai", text: result.response };
            
            setTranscript([aiMessage]);
            setHistory([{ role: 'model', content: [{ text: result.response }] }]);
            
            if (result.audio) {
              await playAudio(result.audio);
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
  }, [showDisclaimer, history, sessionState, voice, playAudio]);


  // --- Speech Recognition Setup ---
  useEffect(() => {
    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window)) {
      console.log("Speech recognition not supported");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
        setSessionState('listening');
    };
    
    recognition.onend = () => {
      // Only change state if we are currently in the listening state
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
        setSessionState('idle'); // Stop listening visually
        const finalTranscript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        if (finalTranscript.trim()) {
            handleSpeech(finalTranscript.trim());
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
  }, [handleSpeech, sessionState]); // Re-create listeners if state logic changes

  const toggleListen = () => {
    if (sessionState === 'listening') {
      recognitionRef.current?.stop();
      setSessionState('idle');
    } else if (sessionState === 'idle') {
      recognitionRef.current?.start();
    }
  };

  const handleDisclaimerAgree = () => {
      setShowDisclaimer(false);
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


"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Loader2, BrainCircuit, MicIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import DisclaimerDialog from "./DisclaimerDialog";
import { therapyConversation } from "@/ai/flows/therapy-conversation";
import type { MessageData } from 'genkit/ai';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore";
import type { TherapyMessage } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useToast } from "@/hooks/use-toast";

// A state machine to manage the session's flow and prevent race conditions.
type SessionState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'requesting_permission';

export default function TherapySession() {
  const [isMounted, setIsMounted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const [voice, setVoice] = useState('Algenib');
  const { toast } = useToast();

  const sessionId = params.id as string;

  const messagesQuery = useMemoFirebase(() => {
    if (!user || !sessionId) return null;
    return query(
      collection(firestore, `userProfiles/${user.uid}/therapySessions/${sessionId}/messages`),
      orderBy("createdAt", "asc")
    );
  }, [user, firestore, sessionId]);

  const { data: messages, isLoading: messagesLoading } = useCollection<TherapyMessage>(messagesQuery);

  const history: MessageData[] = messages ? messages.map(m => ({ role: m.role, content: m.content })) : [];
  const transcript = messages ? messages.map(m => ({ speaker: m.role, text: m.content[0].text })) : [];

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
    if (!text || !user || !messagesQuery) {
        setSessionState('idle');
        return;
    }

    setSessionState('thinking');

    const userMessage: MessageData = { role: 'user', content: [{ text }] };
    const messagesCollectionRef = collection(firestore, `userProfiles/${user.uid}/therapySessions/${sessionId}/messages`);
    await addDocumentNonBlocking(messagesCollectionRef, { ...userMessage, createdAt: serverTimestamp() });
    
    try {
      const currentHistory = [...history, userMessage];
      const result = await therapyConversation({ history: currentHistory, message: text, voiceName: voice });

      const aiMessage: MessageData = { role: 'model', content: [{ text: result.response }] };
      await addDocumentNonBlocking(messagesCollectionRef, { ...aiMessage, createdAt: serverTimestamp() });
      
      const isCrisisResponse = result.response.includes("988");

      if (result.audio && !isCrisisResponse) {
        await playAudio(result.audio);
      } else {
        setSessionState('idle');
      }

    } catch (error) {
      console.error("Error with therapy conversation flow:", error);
      const errorMessage = "I'm having a little trouble connecting right now. Please give me a moment.";
      const aiMessage: MessageData = { role: 'model', content: [{text: errorMessage}] };
      await addDocumentNonBlocking(messagesCollectionRef, { ...aiMessage, createdAt: serverTimestamp() });
      setSessionState('idle');
    }
  }, [user, sessionId, firestore, history, voice, playAudio, messagesQuery]);

  const toggleListen = useCallback(() => {
    if (sessionState === 'listening') {
      recognitionRef.current?.stop();
      setSessionState('idle');
    } else if (sessionState === 'idle' && hasMicPermission) {
      recognitionRef.current?.start();
    }
  }, [sessionState, hasMicPermission]);

  // --- Initial Greeting & Auto-Listen ---
  useEffect(() => {
    if (!showDisclaimer && !messagesLoading && messages?.length === 0 && sessionState === 'idle' && user && messagesQuery) {
      const initialGreeting = "Hello, I'm Bud. I'm here to listen. How are you feeling today?";
      
       (async () => {
          setSessionState('thinking');
          const messagesCollectionRef = collection(firestore, `userProfiles/${user.uid}/therapySessions/${sessionId}/messages`);
          try {
            const result = await therapyConversation({ history: [], message: "", voiceName: voice });
            const aiMessage: MessageData = { role: 'model', content: [{ text: result.response }] };
            await addDocumentNonBlocking(messagesCollectionRef, { ...aiMessage, createdAt: serverTimestamp() });
            
            if (result.audio) {
              await playAudio(result.audio);
            } else {
              setSessionState('idle');
            }
          } catch(e) {
            console.error("Failed to generate initial greeting", e);
             const aiMessage: MessageData = { role: 'model', content: [{ text: initialGreeting }] };
            await addDocumentNonBlocking(messagesCollectionRef, { ...aiMessage, createdAt: serverTimestamp() });
            setSessionState('idle');
          }
      })();
    }
  }, [showDisclaimer, messages, messagesLoading, sessionState, voice, playAudio, user, firestore, sessionId, messagesQuery]);


  // --- Speech Recognition Setup ---
  useEffect(() => {
    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window) || !hasMicPermission) {
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
      if (sessionState === 'listening') {
        setSessionState('idle');
      }
    };
    
    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
            setPermissionError("Microphone access was denied. Please enable it in your browser settings and refresh the page.");
            setHasMicPermission(false);
        }
      }
      if (sessionState === 'listening') {
        setSessionState('idle');
      }
    };
    
    recognition.onresult = (event) => {
      setSessionState('thinking'); 
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
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      }
      if(audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      }
    };
  }, [handleSpeech, hasMicPermission]); // Re-run setup if permission changes


  // Auto-start listening when AI is done speaking
  useEffect(() => {
    if (sessionState === 'idle' && !messagesLoading && messages && messages.length > 0 && hasMicPermission) {
      toggleListen();
    }
  }, [sessionState, messages, messagesLoading, hasMicPermission, toggleListen]);

  const handleDisclaimerAgree = async () => {
    setShowDisclaimer(false);
    setSessionState('requesting_permission');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasMicPermission(true);
        setPermissionError(null);
        stream.getTracks().forEach(track => track.stop()); // Stop the track immediately, we just needed permission
        setSessionState('idle');
        toast({
            title: "Microphone Enabled",
            description: "You can start speaking when the mic is active.",
        });
    } catch (error) {
        console.error("Microphone permission error:", error);
        setHasMicPermission(false);
        setPermissionError("Microphone access was denied. Please enable it in your browser settings to use the voice feature.");
        setSessionState('idle');
    }
  }

  const getStatusContent = () => {
    if (messagesLoading) {
        return <div className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading session...</div>;
    }
     if (permissionError) {
        return <p className="text-red-400">{permissionError}</p>;
    }
    switch (sessionState) {
        case 'requesting_permission':
            return <div className="flex items-center gap-2"><MicIcon className="w-5 h-5 animate-pulse" /> Requesting mic access...</div>;
        case 'listening':
            return <p>Listening...</p>;
        case 'thinking':
            return <div className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 animate-pulse" /> AI is thinking...</div>;
        case 'speaking':
            return <p>AI is speaking...</p>;
        case 'idle':
        default:
             if (!hasMicPermission) {
                return <p>Enable microphone to begin.</p>;
            }
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

  const isMicButtonDisabled = sessionState !== 'idle' && sessionState !== 'listening' || messagesLoading || !hasMicPermission;
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

        {permissionError && (
             <Alert variant="destructive" className="max-w-md mt-4 bg-destructive/20 border-destructive text-destructive-foreground">
                <AlertTitle>Microphone Access Denied</AlertTitle>
                <AlertDescription>
                    {permissionError}
                </AlertDescription>
            </Alert>
        )}

        <div className="absolute bottom-32 left-4 right-4 text-center max-h-48 overflow-y-auto">
            {lastMessage && (
              <p className={cn(
                  "text-xl transition-opacity duration-300",
                  lastMessage.speaker === 'model' && lastMessage.text.includes("988") ? "text-destructive font-semibold" :
                  lastMessage.speaker === 'model' ? "text-primary/90" : "text-white"
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
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-green-500 hover:bg-green-600",
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


    
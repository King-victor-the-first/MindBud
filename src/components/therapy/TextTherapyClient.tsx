
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { therapyConversation, generateSpeech } from "@/ai/flows/therapy-conversation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, addDoc } from "firebase/firestore";
import type { TherapyMessage } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Mic, ArrowLeft, BrainCircuit, PlayCircle, Speaker } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import DisclaimerDialog from "./DisclaimerDialog";
import { useToast } from "@/hooks/use-toast";
import type { MessageData } from 'genkit/ai';

type TextTherapyClientProps = {
  isImmersive?: boolean;
}

export default function TextTherapyClient({ isImmersive = false }: TextTherapyClientProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(!isImmersive);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [speechApiSupported, setSpeechApiSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  
  const sessionId = params.id as string;
  const aiAvatar = PlaceHolderImages.find((p) => p.id === "therapy-session-ai-avatar") || { imageUrl: "/placeholder.svg", imageHint: "AI avatar"};

  useEffect(() => {
    // Initialize Audio element on client
    audioRef.current = new Audio();
    audioRef.current.onended = () => setAudioPlayingId(null);
    audioRef.current.onpause = () => setAudioPlayingId(null);
  }, []);

  const playAudio = useCallback(async (messageId: string, text: string) => {
      if (audioRef.current) {
        if (audioPlayingId === messageId) {
            audioRef.current.pause();
            return;
        }

        setAudioPlayingId(messageId);
        try {
            const aiVoice = localStorage.getItem('aiVoice') || 'Algenib';
            const { audio } = await generateSpeech({ text, voiceName: aiVoice });
            audioRef.current.src = audio;
            audioRef.current.play();
        } catch (error) {
            console.error("Error generating or playing audio:", error);
            toast({ title: "Audio Error", description: "Could not play audio.", variant: "destructive" });
            setAudioPlayingId(null);
        }
      }
  }, [audioPlayingId, toast]);

  const messagesQuery = useMemoFirebase(() => {
    if (!user || !sessionId) return null;
    return query(
      collection(firestore, `userProfiles/${user.uid}/therapySessions/${sessionId}/messages`),
      orderBy("createdAt", "asc")
    );
  }, [user, firestore, sessionId]);

  const { data: messages, isLoading: messagesLoading } = useCollection<TherapyMessage>(messagesQuery);
  
  const history: MessageData[] = messages ? messages.map(m => ({ 
      role: m.role, 
      content: m.content
  })) : [];
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setIsMounted(true);
    if (isImmersive) {
      setShowDisclaimer(false);
    }
  }, [isImmersive]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechApiSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        if (finalTranscript) {
            setInput(prev => prev ? prev + ' ' + finalTranscript : finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        toast({ title: "Voice Error", description: event.error, variant: "destructive" });
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput(prev => prev ? prev + ' ' : '');
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const handleSend = async () => {
    if (!input.trim() || !user || !sessionId) return;
    const userMessage = input;
    setInput("");
    setIsSending(true);

    try {
      const messagesCollectionRef = collection(firestore, `userProfiles/${user.uid}/therapySessions/${sessionId}/messages`);
      await addDoc(messagesCollectionRef, { role: 'user', content: [{text: userMessage}], createdAt: serverTimestamp() });
      
      const result = await therapyConversation({
        history: history,
        message: userMessage,
      });
      
      await addDoc(messagesCollectionRef, { role: 'model', content: [{text: result.response}], createdAt: serverTimestamp() });

    } catch (error) {
      console.error("Error in therapy conversation:", error);
      toast({
        title: "An error occurred",
        description: "Could not get a response from the AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Initial greeting logic
  useEffect(() => {
    if (!showDisclaimer && !messagesLoading && messages?.length === 0 && user) {
       (async () => {
          const messagesCollectionRef = collection(firestore, `userProfiles/${user.uid}/therapySessions/${sessionId}/messages`);
          const initialGreeting = "Hello, I'm Bud. I'm here to listen. How are you feeling today?";
          await addDoc(messagesCollectionRef, { role: 'model', content: [{text: initialGreeting}], createdAt: serverTimestamp() });
      })();
    }
  }, [showDisclaimer, messages, messagesLoading, user, firestore, sessionId]);

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (showDisclaimer) {
    return <DisclaimerDialog onAgree={() => setShowDisclaimer(false)} />;
  }

  const MainContainer = isImmersive ? ScrollArea : 'div';
  const mainContainerProps = { 
    className: "flex-1 chat-background-pattern pb-24 pt-16" 
  };


  return (
    <div className={cn("h-screen flex flex-col", isImmersive ? "bg-gray-900" : "bg-muted/20")}>
      {!isImmersive && (
        <header className="fixed top-0 left-0 right-0 z-20 p-2 border-b flex-shrink-0 bg-background/80 backdrop-blur-sm md:ml-64">
          <div className="flex items-center justify-between gap-2">
            <Link href="/therapy" passHref className="md:hidden">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="text-center flex-1 md:text-left md:pl-2">
              <h1 className="text-lg font-headline font-bold">AI Therapist</h1>
              <p className="text-xs text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                <BrainCircuit className="w-3 h-3 text-primary" />
                Your Private Session
              </p>
            </div>
             <Link href={`/therapy-session/${sessionId}`} passHref>
                <Button variant="outline" size="sm">
                    <Mic className="w-4 h-4 mr-2"/>
                    Switch to Voice
                </Button>
             </Link>
          </div>
        </header>
      )}

      <MainContainer {...mainContainerProps}>
        <div className="p-4 space-y-4">
          {messagesLoading && messages?.length === 0 && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {messages?.map((msg) => {
            const isUser = msg.role === 'user';
            const textContent = Array.isArray(msg.content) && msg.content[0]?.text ? msg.content[0].text : (typeof msg.content === 'string' ? msg.content : '');

            return (
              <div key={msg.id} className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
                {!isUser && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={aiAvatar.imageUrl} data-ai-hint={aiAvatar.imageHint} />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                    "relative max-w-[75%] rounded-xl px-3 py-2 shadow-sm text-sm",
                    isUser
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : isImmersive ? "bg-gray-700 text-gray-200 rounded-bl-none" : "bg-card text-card-foreground rounded-bl-none"
                  )}
                >
                  {textContent}
                  {!isUser && textContent && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-card/80 text-muted-foreground hover:bg-card hover:text-primary"
                        onClick={() => playAudio(msg.id, textContent)}
                    >
                        {audioPlayingId === msg.id ? <Speaker className="w-4 h-4"/> : <PlayCircle className="w-4 h-4"/>}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </MainContainer>

      <div className={cn(
        "z-20 p-2 bg-card border-t",
        isImmersive ? "bg-gray-800 border-t-white/10" : "fixed bottom-0 left-0 right-0 md:ml-64"
        )}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              disabled={isSending}
              className={cn("flex-1", isImmersive && "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 rounded-full px-4", speechApiSupported && "pr-10")}
            />
            {speechApiSupported && (
                <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost"
                    onClick={toggleListening}
                    className={cn(
                        "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary",
                        isListening && "text-red-500 animate-pulse"
                    )}
                    aria-label={isListening ? "Stop recording" : "Start recording"}
                >
                   <Mic className="w-4 h-4" />
                </Button>
            )}
          </div>
          <Button onClick={handleSend} disabled={isSending || !input.trim()} size="icon" className={cn(isImmersive && "rounded-full bg-primary")}>
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { therapyConversation } from "@/ai/flows/therapy-conversation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, addDoc, doc } from "firebase/firestore";
import type { TherapyMessage } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Mic, ArrowLeft, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import DisclaimerDialog from "./DisclaimerDialog";
import { useToast } from "@/hooks/use-toast";
import type { MessageData } from 'genkit/ai';

export default function TextTherapyClient() {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const sessionId = params.id as string;
  const aiAvatar = PlaceHolderImages.find((p) => p.id === "therapy-session-ai-avatar") || { imageUrl: "/placeholder.svg", imageHint: "AI avatar"};

  const messagesQuery = useMemoFirebase(() => {
    if (!user || !sessionId) return null;
    return query(
      collection(firestore, `userProfiles/${user.uid}/therapySessions/${sessionId}/messages`),
      orderBy("createdAt", "asc")
    );
  }, [user, firestore, sessionId]);

  const { data: messages, isLoading: messagesLoading } = useCollection<TherapyMessage>(messagesQuery);
  const history: MessageData[] = messages ? messages.map(m => ({ role: m.role, content: m.content as any })) : [];
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        voiceName: 'Algenib', // Voice is not used but required by schema
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
          setIsSending(true);
          const messagesCollectionRef = collection(firestore, `userProfiles/${user.uid}/therapySessions/${sessionId}/messages`);
          try {
            const result = await therapyConversation({ history: [], message: "", voiceName: 'Algenib' });
            await addDoc(messagesCollectionRef, { role: 'model', content: [{text: result.response}], createdAt: serverTimestamp() });
          } catch(e) {
            console.error("Failed to generate initial greeting", e);
            const initialGreeting = "Hello, I'm Bud. I'm here to listen. How are you feeling today?";
            await addDoc(messagesCollectionRef, { role: 'model', content: [{text: initialGreeting}], createdAt: serverTimestamp() });
          } finally {
            setIsSending(false);
          }
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

  return (
    <div className="h-screen flex flex-col bg-muted/20">
      <header className="fixed top-0 left-0 right-0 z-20 p-2 border-b flex-shrink-0 bg-background/80 backdrop-blur-sm md:ml-64">
        <div className="flex items-center gap-2">
          <Link href="/therapy" passHref className="md:hidden">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-lg font-headline font-bold">AI Therapist</h1>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <BrainCircuit className="w-3 h-3 text-primary" />
              Your Private Session
            </p>
          </div>
          <div className="w-10 h-10 md:hidden" />
        </div>
      </header>

      <ScrollArea className="flex-1 chat-background-pattern pb-24 pt-16">
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
                    "max-w-[75%] rounded-xl px-3 py-2 shadow-sm text-sm",
                    isUser
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card text-card-foreground rounded-bl-none"
                  )}
                >
                  {textContent}
                </div>
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="fixed bottom-0 left-0 right-0 z-20 p-2 bg-card border-t md:ml-64">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={isSending}
            className="flex-1"
          />
          <Link href={`/therapy-session/${sessionId}`} passHref>
             <Button variant="outline" size="icon" aria-label="Start Live Voice Session">
                <Mic className="w-5 h-5 text-primary"/>
             </Button>
          </Link>
          <Button onClick={handleSend} disabled={isSending || !input.trim()} size="icon">
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

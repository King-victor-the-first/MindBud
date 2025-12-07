
"use client";

import { useState, useRef, useEffect, UIEvent } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { moderateGroupChatMessage } from "@/ai/flows/moderate-group-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Send, Loader2, MoreHorizontal, Trash2, Reply, X, Image, ShieldCheck, ChevronDown, ArrowLeft, Mic, Mic2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { uploadFile, getStorageInstance } from "@/firebase/storage";
import { Badge } from "@/components/ui/badge";
import type { UserProfile, ChatMessage } from "@/lib/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SiriWave from "../shared/SiriWave";


type ChatInterfaceProps = {
    onStartVoiceSession: () => void;
};


export default function ChatInterface({ onStartVoiceSession }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const [isListening, setIsListening] = useState(false);
  const [speechApiSupported, setSpeechApiSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);


  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "userProfiles", user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const messagesQuery = useMemoFirebase(() => 
    query(collection(firestore, "groupChatMessages"), orderBy("createdAt", "asc"))
  , [firestore]);

  const { data: messages, isLoading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);

  const scrollToBottom = (behavior: "smooth" | "auto" = "auto") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }

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


  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop - clientHeight > 100) {
      setShowScrollToBottom(true);
    } else {
      setShowScrollToBottom(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !mediaFile) || !user || !userProfile) return;

    setIsSending(true);

    try {
      const moderationResult = await moderateGroupChatMessage({
        message: input,
        userId: user.uid,
      });

      if (!moderationResult.isSafe) {
        toast({
          title: "Message Blocked",
          description: `Your message was blocked: ${moderationResult.reason}`,
          variant: "destructive",
        });
        setInput("");
        setMediaFile(null);
        setIsSending(false);
        return;
      }
      
      const displayName = userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName?.[0] || ''}.` : user.displayName || 'Anonymous';
      const isModerator = userProfile.isModerator === true;

      const newMessage: Omit<ChatMessage, 'id' | 'mediaUrl' | 'mediaType'> & { mediaUrl?: string, mediaType?: string } = {
        userId: user.uid,
        userName: displayName,
        avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
        message: input,
        createdAt: serverTimestamp(),
        isModerator,
        isDeleted: false,
      };
      
      if (mediaFile) {
        try {
          const storage = getStorageInstance();
          const { downloadURL } = await uploadFile(storage, mediaFile, `chat/${user.uid}/${Date.now()}_${mediaFile.name}`);
          newMessage.mediaUrl = downloadURL;
          newMessage.mediaType = mediaFile.type;
        } catch (uploadError) {
           console.error("Error uploading file:", uploadError);
           toast({
              title: "Upload Failed",
              description: "Could not upload the image. Please try again.",
              variant: "destructive",
           });
           setIsSending(false);
           return;
        }
      }

      if (replyTo) {
        newMessage.replyTo = {
            messageId: replyTo.id,
            messageOwner: replyTo.userName,
            messageSnippet: replyTo.message || (replyTo.mediaUrl ? "Image" : "")
        }
      }
      
      const messagesCollectionRef = collection(firestore, "groupChatMessages");
      await addDocumentNonBlocking(messagesCollectionRef, newMessage);

      setInput("");
      setReplyTo(null);
      setMediaFile(null);

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Could not send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!user) return;
    const messageDocRef = doc(firestore, "groupChatMessages", messageId);
    updateDocumentNonBlocking(messageDocRef, {
        message: "This message was deleted.",
        isDeleted: true,
        mediaUrl: null,
        mediaType: null,
    });
    setDeleteConfirmation(null);
    toast({
      title: "Message Deleted",
      description: "Your message has been removed.",
    });
  };

  const loading = isSending || messagesLoading;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">

      {/* New Fixed Header for Chat */}
       <div className="fixed top-0 left-0 right-0 z-20 p-2 border-b flex-shrink-0 bg-background/80 backdrop-blur-sm md:ml-64">
         <div className="flex items-center gap-2">
            <Link href="/dashboard" passHref className="md:hidden">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="text-center flex-1">
              <h1 className="text-lg font-headline font-bold">Support Circle</h1>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  Anonymous & Moderated
              </p>
            </div>
             <Button variant="outline" size="sm" className="md:w-auto md:px-3" onClick={onStartVoiceSession} disabled={loading}>
                <div className="md:hidden"><Mic2 className="w-5 h-5"/></div>
                <Mic className="w-4 h-4 hidden md:inline-block md:mr-2"/>
                <span className="hidden md:inline">Start a Live Session</span>
            </Button>
         </div>
       </div>


      <div className="relative flex-1 mt-[68px]">
        <ScrollArea className="absolute inset-0 chat-background-pattern pb-24" viewportRef={scrollAreaRef} onScroll={handleScroll}>
            <div className="flex flex-col gap-1 p-4">
            {messagesLoading && (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}
            {messages && messages.map((msg) => {
                const isYou = msg.userId === user?.uid;
                
                return (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex items-end gap-2 w-full",
                            isYou ? "justify-end" : "justify-start"
                        )}
                    >
                        {!isYou && <Avatar className="w-8 h-8 mb-4">
                            <AvatarImage src={msg.avatarUrl} />
                            <AvatarFallback>{msg.userName?.substring(0, 2) || 'A'}</AvatarFallback>
                        </Avatar>}
                        <div className={cn(
                                "group relative max-w-[75%] rounded-xl px-3 py-2 shadow-sm",
                                isYou 
                                    ? "bg-primary text-primary-foreground rounded-br-none" 
                                    : "bg-card text-card-foreground rounded-bl-none",
                                msg.isDeleted && "bg-transparent shadow-none italic text-muted-foreground text-sm"
                            )}
                        >
                            {!isYou && !msg.isDeleted && (
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-sm text-primary">{msg.userName}</p>
                                    {msg.isModerator && (
                                        <Badge variant="secondary" className="h-5 px-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                                            <ShieldCheck className="w-3 h-3 mr-1" />
                                            Mod
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {msg.replyTo && !msg.isDeleted && (
                                <div className="p-2 mb-2 rounded-md bg-black/10 dark:bg-white/10 text-xs opacity-80">
                                    <p className="font-semibold">{msg.replyTo.messageOwner}</p>
                                    <p className="truncate">{msg.replyTo.messageSnippet}</p>
                                </div>
                            )}
                            
                            {msg.mediaUrl && !msg.isDeleted && msg.mediaType?.startsWith('image/') && (
                                <NextImage src={msg.mediaUrl} alt="Shared media" width={200} height={200} className="rounded-md mb-2 object-cover" />
                            )}

                            <p className={cn("text-sm pb-4 pr-10", msg.isDeleted && "pb-0 pr-0")}>{msg.message}</p>
                            
                            {!msg.isDeleted && msg.createdAt && (
                                <span className="absolute bottom-1 right-2 text-xs opacity-60">
                                    {format(new Date(msg.createdAt.seconds * 1000), 'p')}
                                </span>
                            )}

                            {!msg.isDeleted && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="absolute top-0 -right-10 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setReplyTo(msg)}>
                                            <Reply className="w-4 h-4 mr-2" />
                                            Reply
                                        </DropdownMenuItem>
                                        {isYou && (
                                            <DropdownMenuItem onClick={() => setDeleteConfirmation(msg.id)} className="text-destructive">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                )
            })}
             <div ref={messagesEndRef} />
            </div>
        </ScrollArea>
         {showScrollToBottom && (
          <Button
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-28 right-4 z-10 rounded-full h-10 w-10 p-2 shadow-lg"
            variant="secondary"
            size="icon"
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
        )}
      </div>

       <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this message for everyone. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteMessage(deleteConfirmation!)} className={cn(buttonVariants({variant: "destructive"}))}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* New Fixed Input Area */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-2 bg-card border-t md:ml-64">
        {replyTo && (
            <div className="flex items-center justify-between p-2 mb-2 bg-muted rounded-md text-sm mx-2">
                <div>
                    <p className="font-semibold">Replying to {replyTo.userName}</p>
                    <p className="text-xs truncate text-muted-foreground">{replyTo.message || "Image"}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setReplyTo(null)}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
        )}
        {mediaFile && (
            <div className="flex items-center justify-between p-2 mb-2 bg-muted rounded-md text-sm mx-2">
                <div>
                    <p className="font-semibold">Attachment</p>
                    <p className="text-xs truncate text-muted-foreground">{mediaFile.name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMediaFile(null)}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
        )}
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <Image className="w-5 h-5" />
          </Button>
          <Input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <div className="relative flex-1">
            <Input
              placeholder="Type a supportive message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
              className={cn(speechApiSupported && "pr-10")}
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
          <Button onClick={handleSend} disabled={loading || (!input.trim() && !mediaFile)} size="icon">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

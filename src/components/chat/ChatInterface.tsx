
"use client";

import { useState, useRef, useEffect } from "react";
import NextImage from "next/image";
import { moderateGroupChatMessage } from "@/ai/flows/moderate-group-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Send, Loader2, MoreHorizontal, Trash2, Reply, X, Image, ShieldCheck } from "lucide-react";
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
import type { FirebaseStorage } from "firebase/storage";

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const [storage, setStorage] = useState<FirebaseStorage | null>(null);


  useEffect(() => {
    // Correctly get storage instance on the client
    setStorage(getStorageInstance());
  }, []);


  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "userProfiles", user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const messagesQuery = useMemoFirebase(() => 
    query(collection(firestore, "groupChatMessages"), orderBy("createdAt", "asc"))
  , [firestore]);

  const { data: messages, isLoading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);

  const scrollToBottom = () => {
     if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            setTimeout(() => {
                viewport.scrollTop = viewport.scrollHeight;
            }, 0);
        }
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !mediaFile) || !user) return;

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
      
      const displayName = userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName?.[0] || ''}.` : user.displayName || 'Anonymous';
      const isModerator = userProfile?.isModerator === true;

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
        if (!storage) {
            throw new Error("Storage service is not available.");
        }
        const { downloadURL } = await uploadFile(storage, mediaFile, `chat/${user.uid}/${Date.now()}_${mediaFile.name}`);
        newMessage.mediaUrl = downloadURL;
        newMessage.mediaType = mediaFile.type;
      }

      if (replyTo) {
        newMessage.replyTo = {
            messageId: replyTo.id,
            messageOwner: replyTo.userName,
            messageSnippet: replyTo.message || (replyTo.mediaUrl ? "Image" : "")
        }
      }

      const messagesCollectionRef = collection(firestore, "groupChatMessages");
      await addDocumentNonBlocking(messagesCollectionRef, newMessage).catch(err => {
        throw err;
      });

      setInput("");
      setReplyTo(null);
      setMediaFile(null);
      scrollToBottom();

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
    <div className="flex-1 flex flex-col chat-background-pattern">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-1">
          {messagesLoading && (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {messages && messages.map((msg, index) => {
            const isYou = msg.userId === user?.uid;
            const prevMsg = messages[index - 1];
            const showAvatarAndName = !prevMsg || prevMsg.userId !== msg.userId;

            return (
                <div
                key={msg.id}
                className={cn(
                    "flex items-start gap-3 group",
                    isYou ? "flex-row-reverse" : "",
                    !showAvatarAndName && (isYou ? "ml-11" : "ml-11")
                )}
                >
                <div className="w-8 h-8 flex-shrink-0">
                  {showAvatarAndName && (
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={msg.avatarUrl} />
                        <AvatarFallback>{msg.userName?.substring(0, 2) || 'A'}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div
                    className={cn(
                    "max-w-xs md:max-w-md p-3 rounded-xl relative shadow-md",
                     isYou
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-card-foreground",
                     msg.isDeleted && "italic text-muted-foreground bg-transparent p-1 shadow-none",
                     showAvatarAndName ? (isYou ? "rounded-br-none" : "rounded-bl-none") : "rounded-lg"
                    )}
                >
                    {!isYou && !msg.isDeleted && showAvatarAndName && (
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{msg.userName}</p>
                            {msg.isModerator && (
                                <Badge variant="secondary" className="h-5 px-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                                    <ShieldCheck className="w-3 h-3 mr-1" />
                                    Mod
                                </Badge>
                            )}
                        </div>
                    )}

                    {msg.replyTo && !msg.isDeleted && (
                         <div className="p-2 mb-2 rounded-md bg-black/10 dark:bg-white/10 text-xs">
                            <p className="font-semibold">{msg.replyTo.messageOwner}</p>
                            <p className="truncate opacity-80">{msg.replyTo.messageSnippet}</p>
                        </div>
                    )}
                    
                    {msg.mediaUrl && !msg.isDeleted && msg.mediaType?.startsWith('image/') && (
                        <NextImage src={msg.mediaUrl} alt="Shared media" width={200} height={200} className="rounded-md mb-2 object-cover" />
                    )}

                    <p className="text-sm">{msg.message}</p>
                </div>
                {!msg.isDeleted && (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
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
            )
          })}
        </div>
      </ScrollArea>
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
      <div className="p-4 bg-card border-t flex-shrink-0">
        {replyTo && (
            <div className="flex items-center justify-between p-2 mb-2 bg-muted rounded-md text-sm">
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
            <div className="flex items-center justify-between p-2 mb-2 bg-muted rounded-md text-sm">
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
          <Input
            placeholder="Type a supportive message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || (!input.trim() && !mediaFile)} size="icon">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
    

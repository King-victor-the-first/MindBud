
"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { GratitudeEntry } from "@/lib/types";
import { Loader2, PenSquare, Mic, Pen, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function GratitudeJournal() {
  const [showModal, setShowModal] = useState(false);
  const [entryText, setEntryText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [isListening, setIsListening] = useState(false);
  const [speechApiSupported, setSpeechApiSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const entryRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `userProfiles/${user.uid}/gratitudeJournal`, todayStr);
  }, [user, firestore, todayStr]);

  const { data: todayEntry, isLoading: isEntryLoading } = useDoc<GratitudeEntry>(entryRef);

  useEffect(() => {
    if (todayEntry) {
        setEditText(todayEntry.entry);
    }
  }, [todayEntry]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechApiSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (isEditing) {
            setEditText(prev => prev + finalTranscript);
        } else {
            setEntryText(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        toast({ title: "Voice Error", description: event.error, variant: "destructive" });
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      }

      recognitionRef.current = recognition;
    }
  }, [toast, isEditing]);


  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if(isEditing) {
        setEditText(prev => prev ? prev + ' ' : '');
      } else {
        setEntryText(prev => prev ? prev + ' ' : '');
      }
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };


  const handleSaveEntry = async () => {
    if (!entryText.trim() || !user || !entryRef) return;
    setIsSaving(true);
    try {
      const newEntry = {
        date: todayStr,
        entry: entryText,
        createdAt: serverTimestamp(),
      };
      await setDoc(entryRef, newEntry);
      toast({
        title: "Gratitude Logged",
        description: "Your entry has been saved for today.",
      });
      setShowModal(false);
      setEntryText("");
    } catch (error) {
      console.error("Error saving gratitude entry:", error);
      toast({
        title: "Error",
        description: "Could not save your entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEntry = async () => {
    if (!editText.trim() || !user || !entryRef) return;
    setIsSaving(true);
    try {
        await updateDoc(entryRef, { entry: editText });
        toast({
            title: "Gratitude Updated",
            description: "Your entry has been updated.",
        });
        setIsEditing(false);
    } catch (error) {
        console.error("Error updating gratitude entry:", error);
        toast({
            title: "Error",
            description: "Could not update your entry. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };

  if (isUserLoading || (user && isEntryLoading)) {
    return (
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <PenSquare className="w-5 h-5" />
                    Today's Gratitude
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex items-center justify-center h-24">
                <Loader2 className="w-6 h-6 animate-spin text-primary"/>
            </CardContent>
        </Card>
    )
  }

  return (
    <div>
        <h2 className="text-xl font-headline font-semibold mb-4">Today's Gratitude</h2>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <PenSquare className="w-5 h-5" />
                    {!todayEntry ? "What are you grateful for?" : "Your Gratitude Today"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {todayEntry ? (
                    isEditing ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Textarea 
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    rows={4}
                                    className={cn(speechApiSupported && "pr-12")}
                                    autoFocus
                                />
                                {speechApiSupported && (
                                    <Button 
                                        type="button" 
                                        size="icon" 
                                        variant="ghost"
                                        onClick={toggleListening}
                                        className={cn(
                                            "absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-primary",
                                            isListening && "text-red-500 animate-pulse"
                                        )}
                                        aria-label={isListening ? "Stop recording" : "Start recording"}
                                    >
                                       <Mic className="w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                                <Button size="icon" onClick={handleUpdateEntry} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-start gap-4">
                            <p className="text-muted-foreground italic flex-1">"{todayEntry.entry}"</p>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                                <Pen className="w-4 h-4" />
                            </Button>
                        </div>
                    )
                ) : (
                    <>
                        <p className="text-muted-foreground mb-4">
                            What's one good thing that happened today, no matter how small?
                        </p>
                        <Button onClick={() => setShowModal(true)}>Add Today's Entry</Button>
                    </>
                )}
            </CardContent>
        </Card>

        <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Today's Gratitude</DialogTitle>
                    <DialogDescription>
                       Focusing on the positive can make a big difference. What's one good thing from your day?
                    </DialogDescription>
                </DialogHeader>
                <div className="relative">
                    <Textarea 
                        placeholder="e.g., I had a nice conversation with a friend..."
                        value={entryText}
                        onChange={(e) => setEntryText(e.target.value)}
                        rows={4}
                        className={cn(speechApiSupported && "pr-12")}
                    />
                    {speechApiSupported && (
                        <Button 
                            type="button" 
                            size="icon" 
                            variant="ghost"
                            onClick={toggleListening}
                            className={cn(
                                "absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-primary",
                                isListening && "text-red-500 animate-pulse"
                            )}
                            aria-label={isListening ? "Stop recording" : "Start recording"}
                        >
                           <Mic className="w-5 h-5" />
                        </Button>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSaveEntry} disabled={isSaving || !entryText.trim()}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Entry
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

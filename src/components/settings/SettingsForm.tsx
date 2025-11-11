
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, getFirestore } from "firebase/firestore";
import { useUser, useDoc, useMemoFirebase } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlayCircle, ShieldCheck } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { generateSpeechSample } from "@/ai/flows/generate-speech-sample";

const profileSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email" }).or(z.literal("")).optional(),
  aiVoice: z.string().optional(),
});

const availableVoices = [
    { id: 'Algenib', name: 'Algenib (Default)' },
    { id: 'Achernar', name: 'Achernar' },
    { id: 'Schedar', name: 'Schedar' },
    { id: 'Umbriel', name: 'Umbriel' },
    { id: 'Puck', name: 'Puck' },
    { id: 'Gacrux', name: 'Gacrux' },
    { id: 'Zephyr', name: 'Zephyr' },
];

export default function SettingsForm() {
  const { user } = useUser();
  const firestore = getFirestore();
  const { toast } = useToast();
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "userProfiles", user.uid);
  }, [firestore, user]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      aiVoice: 'Algenib',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        email: userProfile.email || "",
      });
    }
    const savedVoice = localStorage.getItem('aiVoice') || 'Algenib';
    form.setValue('aiVoice', savedVoice);

    // Initialize Audio element on client
    audioRef.current = new Audio();
  }, [userProfile, form]);
  
  const { isSubmitting } = form.formState;

  const handleUpdateProfile = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;

    try {
        const userDocRef = doc(firestore, 'userProfiles', user.uid);
        
        const updatedProfile = {
            firstName: values.firstName,
            lastName: values.lastName,
        };

        setDocumentNonBlocking(userDocRef, updatedProfile, { merge: true });

        if (values.aiVoice) {
            localStorage.setItem('aiVoice', values.aiVoice);
        }

      toast({
        title: "Settings Saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const handlePlaySample = async (voiceId: string) => {
    if (playingVoice) return; // Prevent multiple requests
    
    setPlayingVoice(voiceId);
    try {
        const sampleText = "Hi there, I am Bud AI, your personal AI Therapy assistant";
        const { audio } = await generateSpeechSample({ text: sampleText, voiceName: voiceId });

        if (audioRef.current) {
            audioRef.current.src = audio;
            audioRef.current.play();
            audioRef.current.onended = () => setPlayingVoice(null);
            audioRef.current.onerror = () => {
                toast({ title: "Error playing audio", variant: "destructive" });
                setPlayingVoice(null);
            };
        }
    } catch (err) {
        console.error("Error generating speech sample", err);
        toast({ title: "Could not generate voice sample", variant: "destructive" });
        setPlayingVoice(null);
    }
  }


  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile & Settings</CardTitle>
        <CardDescription>
          Update your personal information and application preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleUpdateProfile)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormDescription>
                      Your email address cannot be changed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormItem>
                <FormLabel>Account Status</FormLabel>
                <FormControl>
                    <Input value={userProfile?.isModerator ? "Moderator" : "Student"} disabled />
                </FormControl>
                <FormDescription>
                    Your account status is managed by an administrator.
                </FormDescription>
              </FormItem>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Crisis & Safety Settings</h3>
                <Link href="/settings/safety-plan" passHref>
                    <Button variant="outline">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Manage My Safety Plan
                    </Button>
                </Link>
                <FormDescription>
                    Configure your trusted contacts and coping strategies for crisis situations.
                </FormDescription>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-medium">AI Voice Settings</h3>
                 <FormField
                  control={form.control}
                  name="aiVoice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Therapist Voice</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a voice for the AI therapist" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableVoices.map(voice => (
                            <div key={voice.id} className="flex items-center justify-between pr-2">
                                <SelectItem value={voice.id} className="w-full">
                                    {voice.name}
                                </SelectItem>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlaySample(voice.id);
                                    }}
                                    disabled={!!playingVoice}
                                >
                                    {playingVoice === voice.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                                </Button>
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the voice and accent for your AI therapy sessions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

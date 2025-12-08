
'use client';

import { Lightbulb, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "../shared/ThemeToggle";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { collection, doc, getFirestore, limit, orderBy, query } from "firebase/firestore";
import type { MoodEntry, UserProfile } from "@/lib/types";
import { useMemoFirebase } from "@/firebase/provider";
import { Button } from "../ui/button";
import Link from "next/link";
import { Card, CardContent } from "../ui/card";
import { generateDailyInsight } from "@/ai/flows/generate-daily-insight";
import { useEffect, useState } from "react";

export default function WelcomeHeader() {
  const { user } = useUser();
  const firestore = getFirestore();
  const [insight, setInsight] = useState<string | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(true);

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "userProfiles", user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const recentMoodsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, `userProfiles/${user.uid}/moodEntries`), 
        orderBy("createdAt", "desc"),
        limit(5)
    );
  }, [firestore, user]);
  
  const { data: recentMoods, isLoading: moodsLoading } = useCollection<MoodEntry>(recentMoodsQuery);

  const getDisplayName = () => {
    if (userProfile) {
      return userProfile.username;
    }
    if (user && user.displayName) {
      return user.displayName;
    }
    return "User";
  };
  
  const getInitials = () => {
    if (userProfile && userProfile.username) {
        return userProfile.username.substring(0, 2).toUpperCase();
    }
    if (user && user.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('');
    }
    return "U";
  }

  useEffect(() => {
    // Wait until both profile and mood data have finished loading.
    if (isProfileLoading || moodsLoading) {
      return;
    }

    // Explicitly check that userProfile is available before calling the AI.
    if (userProfile) {
      setIsInsightLoading(true);
      generateDailyInsight({
        userName: userProfile.username,
        recentMoods: (recentMoods || []).map(m => ({ mood: m.mood, date: m.createdAt?.toDate().toISOString() || new Date().toISOString() }))
      }).then(result => {
        setInsight(result.insight);
      }).catch(err => {
        console.error("Error generating insight:", err);
        // Provide a safe, generic fallback message.
        setInsight("Remember that asking for help is not a sign of weakness; it’s a sign of strength.");
      }).finally(() => {
        setIsInsightLoading(false);
      });
    } else {
        // This case handles when loading is complete but there's no profile (e.g., new anonymous user).
        setInsight("Welcome! Taking a moment to check in with yourself is a great first step on your wellness journey.");
        setIsInsightLoading(false);
    }
  }, [userProfile, isProfileLoading, recentMoods, moodsLoading]);


  return (
    <div className="space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl sm:text-3xl font-headline font-bold text-foreground">
                Good Morning, {getDisplayName()}
                </h1>
                <p className="text-muted-foreground mt-1">
                Welcome to MindBud - Your AI powered mental wellness companion  
                </p>
            </div>
            <div className="flex items-center gap-4 md:hidden">
                <ThemeToggle />
                <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                {user?.photoURL ? (
                    <AvatarImage src={user.photoURL} alt="User Avatar" />
                ) : (
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                )}
                </Avatar>
            </div>
        </div>

        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="p-2 bg-primary/20 rounded-full">
                  <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-headline font-semibold text-lg mb-2">Proactive Insight</h3>
                {isInsightLoading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-foreground/80">Generating your daily insight...</span>
                    </div>
                ) : (
                    <p className="text-sm text-foreground/80 mb-4">
                        {insight}
                    </p>
                )}
                <Link href="/therapy" passHref>
                  <Button size="sm" className="elevation-2 mt-4">Schedule a Mental Wellness Session Today!</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

    

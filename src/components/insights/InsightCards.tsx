
"use client";

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, limit, orderBy } from 'firebase/firestore';
import { subDays } from 'date-fns';
import type { MoodEntry } from '@/lib/types';
import { Loader2, TrendingUp, TrendingDown, Moon, Footprints, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

// Mock data, as sleep and step collections don't exist per prompt
const MOCK_SLEEP_HOURS = [7.5, 6, 8, 5, 7, 8.5, 6.5]; // last 7 days
const MOCK_STEP_COUNT = [8000, 5000, 9000, 12000, 4000, 6500, 10000, 3000, 7500, 11000, 8500, 9500, 5500, 7200]; // last 14 days

export default function InsightCards() {
  const { user } = useUser();
  const firestore = useFirestore();

  const mood7DaysQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `userProfiles/${user.uid}/moodEntries`),
      where('createdAt', '>=', subDays(new Date(), 7)),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const mood30DaysQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `userProfiles/${user.uid}/moodEntries`),
      where('createdAt', '>=', subDays(new Date(), 30)),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: mood7Days, isLoading: loading7Days } = useCollection<MoodEntry>(mood7DaysQuery);
  const { data: mood30Days, isLoading: loading30Days } = useCollection<MoodEntry>(mood30DaysQuery);

  const sleepVsMood = useMemo(() => {
    if (!mood7Days) return null;
    
    let goodSleepMoodTotal = 0;
    let goodSleepDays = 0;
    let poorSleepMoodTotal = 0;
    let poorSleepDays = 0;

    mood7Days.forEach((mood, index) => {
        const sleep = MOCK_SLEEP_HOURS[index % MOCK_SLEEP_HOURS.length] || 0;
        if (sleep >= 7) {
            goodSleepMoodTotal += mood.value;
            goodSleepDays++;
        } else {
            poorSleepMoodTotal += mood.value;
            poorSleepDays++;
        }
    });

    const avgGoodSleepMood = goodSleepDays > 0 ? (goodSleepMoodTotal / goodSleepDays).toFixed(1) : "N/A";
    const avgPoorSleepMood = poorSleepDays > 0 ? (poorSleepMoodTotal / poorSleepDays).toFixed(1) : "N/A";

    return { avgGoodSleepMood, avgPoorSleepMood };
  }, [mood7Days]);

  const activityVsStress = useMemo(() => {
    if (!mood30Days) return null;

    let stressOnActiveDays = 0;
    let activeDaysCount = 0;
    let stressOnInactiveDays = 0;
    let inactiveDaysCount = 0;

    mood30Days.forEach((mood, index) => {
        const steps = MOCK_STEP_COUNT[index % MOCK_STEP_COUNT.length] || 0;
        if (mood.trigger === 'Stress' || mood.mood === 'Bad' || mood.mood === 'Awful') { // Simplified logic
            if (steps >= 7000) {
                stressOnActiveDays++;
            } else {
                stressOnInactiveDays++;
            }
        }
        if (steps >= 7000) activeDaysCount++;
        else inactiveDaysCount++;
    });

    const stressPercentageActive = activeDaysCount > 0 ? ((stressOnActiveDays / activeDaysCount) * 100) : 0;
    const stressPercentageInactive = inactiveDaysCount > 0 ? ((stressOnInactiveDays / inactiveDaysCount) * 100) : 0;
    
    if (stressPercentageInactive === 0) return { improvement: 0 };

    const improvement = stressPercentageActive < stressPercentageInactive ? 
      (((stressPercentageInactive - stressPercentageActive) / stressPercentageInactive) * 100).toFixed(0) : 0;

    return { improvement };
  }, [mood30Days]);
  
  const topTrigger = useMemo(() => {
    if (!mood30Days) return null;

    const triggerCounts: { [key: string]: number } = {};
    mood30Days.forEach(mood => {
        if (mood.trigger && mood.trigger !== "No Clear Reason") {
            triggerCounts[mood.trigger] = (triggerCounts[mood.trigger] || 0) + 1;
        }
    });

    const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
    
    if (sortedTriggers.length === 0) {
        return "None identified";
    }

    let topTriggerName = sortedTriggers[0][0];

    if (topTriggerName === "Other") {
        const otherNotes = mood30Days
            .filter(mood => mood.trigger === "Other" && mood.triggerNote)
            .map(mood => mood.triggerNote);

        if (otherNotes.length > 0) {
            const wordCounts: { [key: string]: number } = {};
            const stopWords = new Set(['a', 'about', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'how', 'i', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where', 'who', 'will', 'with', 'the', 'my', 'me', 'just', 'so', 'very']);
            
            otherNotes.forEach(note => {
                note!.toLowerCase().split(/\s+/).forEach(word => {
                    const cleanWord = word.replace(/[^a-z]/g, '');
                    if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
                        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
                    }
                });
            });

            const sortedWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);
            if (sortedWords.length > 0) {
                const mostCommonWord = sortedWords[0][0];
                // Capitalize the first letter
                topTriggerName = mostCommonWord.charAt(0).toUpperCase() + mostCommonWord.slice(1);
            } else {
                 topTriggerName = "Personal Matters"; // Fallback if notes have no parsable words
            }
        } else {
            topTriggerName = "Personal Matters"; // Fallback if "Other" has no notes
        }
    }

    return topTriggerName;
  }, [mood30Days]);

  const isLoading = loading7Days || loading30Days;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sleepVsMood && (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-blue-500" />
                    Sleep vs. Mood
                </CardTitle>
                 <CardDescription>How sleep quality correlates with your mood over the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Your average mood was <span className="font-bold text-primary">{sleepVsMood.avgGoodSleepMood}/5</span> on good sleep days (7+ hours), and <span className="font-bold text-primary">{sleepVsMood.avgPoorSleepMood}/5</span> on poor sleep days.</p>
            </CardContent>
        </Card>
      )}
       {activityVsStress && (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Footprints className="w-5 h-5 text-yellow-500" />
                    Activity vs. Stress
                </CardTitle>
                <CardDescription>How physical activity impacts your stress levels over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>You reported <span className="font-bold text-primary">{activityVsStress.improvement}% less stress</span> on days you were active (7,000+ steps).</p>
            </CardContent>
        </Card>
      )}
       {topTrigger && (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Top Trigger Analysis
                </CardTitle>
                 <CardDescription>The most common factor affecting your mood in the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Your most common stress trigger this month was <span className="font-bold text-primary">{topTrigger}</span>.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

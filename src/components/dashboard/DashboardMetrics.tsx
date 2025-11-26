
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footprints, Smile, Bed, Edit, Save, Loader2 } from "lucide-react";
import { useWellnessStore } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import type { MoodEntry } from "@/lib/types";
import { startOfDay, endOfDay } from "date-fns";

const moodMap: {[key: string]: {label: string, color: string, emoji: string}} = {
    "1": { label: "Overwhelmed", color: "text-red-500", emoji: "😩" },
    "2": { label: "Angry", color: "text-orange-600", emoji: "😠" },
    "3": { label: "Down", color: "text-orange-500", emoji: "😕" },
    "4": { label: "Neutral", color: "text-yellow-500", emoji: "😐" },
    "5": { label: "Content", color: "text-green-400", emoji: "😊" },
    "6": { label: "Joyful", color: "text-green-500", emoji: "😄" }
};

export default function DashboardMetrics() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { steps, setSteps, sleepHours } = useWellnessStore();
    const [isEditingSteps, setIsEditingSteps] = useState(false);
    const [localSteps, setLocalSteps] = useState(steps);
    const [averageMood, setAverageMood] = useState<{label: string, emoji: string, color: string} | null>(null);

    const todayQuery = useMemoFirebase(() => {
        if (!user) return null;
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        return query(
            collection(firestore, `userProfiles/${user.uid}/moodEntries`),
            where("createdAt", ">=", Timestamp.fromDate(todayStart)),
            where("createdAt", "<=", Timestamp.fromDate(todayEnd))
        );
    }, [user, firestore]);

    const { data: todaysMoods, isLoading: moodsLoading } = useCollection<MoodEntry>(todayQuery);

    useEffect(() => {
        if (todaysMoods && todaysMoods.length > 0) {
            const totalValue = todaysMoods.reduce((acc, mood) => acc + mood.value, 0);
            const avgValue = Math.round(totalValue / todaysMoods.length);
            const moodData = moodMap[String(avgValue)] || { label: "Neutral", emoji: "🤔", color: "text-gray-500"};
            setAverageMood(moodData);
        } else if (!moodsLoading) {
            setAverageMood(null); // No moods logged today
        }
    }, [todaysMoods, moodsLoading]);

    const handleSaveSteps = () => {
        setSteps(localSteps);
        setIsEditingSteps(false);
    };

    const handleStepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            setLocalSteps(Math.max(0, value));
        } else if (e.target.value === '') {
            setLocalSteps(0);
        }
    };

  return (
    <div>
      <h2 className="text-xl font-headline font-semibold mb-4">Your Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Mood Today</CardTitle>
              {moodsLoading ? 
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> :
                <Smile className={`h-4 w-4 text-muted-foreground ${averageMood?.color || 'text-gray-500'}`} />
              }
            </CardHeader>
            <CardContent>
              {moodsLoading ? (
                 <div className="text-2xl font-bold h-[36px] flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                 </div>
              ) : averageMood ? (
                <>
                    <div className="text-2xl font-bold">{averageMood.label}</div>
                    <p className="text-xs text-muted-foreground">{averageMood.emoji}</p>
                </>
              ) : (
                <>
                    <div className="text-2xl font-bold">Not Logged</div>
                    <p className="text-xs text-muted-foreground">Log your mood to see stats.</p>
                </>
              )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sleep</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sleepHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">Last night</p>
            </CardContent>
        </Card>

         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Steps Today</CardTitle>
              <Footprints className="h-4 w-4 text-muted-foreground text-yellow-500" />
            </CardHeader>
            <CardContent>
                {isEditingSteps ? (
                    <div className="flex items-center gap-2">
                        <Input 
                            type="number" 
                            min="0"
                            value={localSteps}
                            onChange={handleStepChange}
                            className="h-9"
                        />
                        <Button size="icon" className="h-9 w-9" onClick={handleSaveSteps}>
                            <Save className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">{steps.toLocaleString()}</div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setLocalSteps(steps);
                            setIsEditingSteps(true);
                        }}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </div>
                )}
              <p className="text-xs text-muted-foreground">Click the pencil to edit</p>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

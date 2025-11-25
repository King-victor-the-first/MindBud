
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footprints, Smile, Bed, Edit, Save } from "lucide-react";
import { useWellnessStore } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function DashboardMetrics() {
    const { steps, setSteps, sleepHours, currentMood } = useWellnessStore();
    const [isEditingSteps, setIsEditingSteps] = useState(false);
    const [localSteps, setLocalSteps] = useState(steps);

    const moodMap: {[key: string]: {color: string, emoji: string}} = {
        "Joyful": { color: "text-green-500", emoji: "😄" },
        "Content": { color: "text-green-400", emoji: "😊" },
        "Neutral": { color: "text-yellow-500", emoji: "😐" },
        "Down": { color: "text-orange-500", emoji: "😕" },
        "Overwhelmed": { color: "text-red-500", emoji: "😩" }
    }
    const { color: moodColor, emoji: moodEmoji } = moodMap[currentMood] || { color: "text-gray-500", emoji: "🤔"};

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
              <CardTitle className="text-sm font-medium">Mood for the day</CardTitle>
              <Smile className={`h-4 w-4 text-muted-foreground ${moodColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMood}</div>
              <p className="text-xs text-muted-foreground">{moodEmoji}</p>
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

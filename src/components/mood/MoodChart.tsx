
"use client"

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from "recharts";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

type MoodEntry = {
  id: string;
  mood: string;
  value: number;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

export default function MoodChart() {
  const { user } = useUser();
  const firestore = useFirestore();

  const moodEntriesRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, `userProfiles/${user.uid}/moodEntries`), 
        orderBy("createdAt", "desc"),
        limit(100)
    );
  }, [firestore, user]);

  const { data: moodEntries, isLoading } = useCollection<MoodEntry>(moodEntriesRef);
  
  const chartData = useMemo(() => {
    if (!moodEntries) return [];
    return moodEntries
        .map(entry => ({
            ...entry,
            date: entry.createdAt ? format(new Date(entry.createdAt.seconds * 1000), "MMM d, h:mm a") : 'N/A',
        }))
        .reverse(); // reverse to show oldest first
  }, [moodEntries]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!chartData || chartData.length < 2) {
    return (
        <Card className="text-center">
            <CardHeader>
                <CardTitle>Not Enough Data</CardTitle>
                <CardDescription>Log your mood a couple of times to see your trends here.</CardDescription>
            </CardHeader>
        </Card>
    )
  }

  const moodLabels = ["Overwhelmed", "Angry", "Down", "Neutral", "Content", "Joyful"];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="h-[300px] w-full">
            <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        tickFormatter={(value) => {
                            if (typeof value !== 'string' || !value.includes(',')) return value;
                            return value.split(',')[0]?.trim() || '';
                        }}
                    />
                    <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={[1, 6]}
                        ticks={[1, 2, 3, 4, 5, 6]}
                        tickFormatter={(value) => moodLabels[value - 1]}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--card-foreground))'
                        }}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMood)" />
                    <Brush dataKey="date" height={30} stroke="hsl(var(--primary))" y={220} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

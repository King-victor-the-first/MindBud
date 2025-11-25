
import MoodSelector from "@/components/mood/MoodSelector";
import SpinWheel from "@/components/mood/SpinWheel";
import MoodChart from "@/components/mood/MoodChart";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export default function MoodPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="space-y-12">

        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <ListChecks className="w-8 h-8 text-primary mt-1" />
              <div>
                <h2 className="font-headline font-semibold text-lg">Your Mood Center</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Here you can:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Log your current mood by selecting an emoji.</li>
                  <li>View your mood trends over time in the chart below.</li>
                  <li>Spin the wheel for a fun, uplifting task to brighten your day.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h1 className="text-3xl font-headline font-bold text-center mb-2">How are you feeling?</h1>
          <p className="text-muted-foreground text-center mb-6">Log your mood to track your emotional wellness.</p>
          <MoodSelector />
        </div>
        
        <Separator />

        <div>
            <h2 className="text-2xl font-headline font-semibold text-center mb-6">Your Mood Over Time</h2>
            <MoodChart />
        </div>

        <Separator />

        <div>
          <h2 className="text-2xl font-headline font-semibold text-center mb-2">Spin for a happy task!</h2>
          <p className="text-muted-foreground text-center mb-6">Brighten your day by brightening someone else's.</p>
          <SpinWheel />
        </div>

      </div>
    </div>
  );
}

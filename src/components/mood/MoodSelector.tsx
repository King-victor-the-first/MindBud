
"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import MoodTriggerModal from "./MoodTriggerModal";
import CrisisModeDialog from "./CrisisModeDialog";
import { useWellnessStore } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

const moods = [
  { label: "Overwhelmed", emoji: "😩", value: 1, description: "Feeling very low, distressed, or overwhelmed" },
  { label: "Angry", emoji: "😠", value: 2, description: "Feeling angry, irritated, or frustrated" },
  { label: "Down", emoji: "😔", value: 3, description: "Feeling down, sad, or unhappy" },
  { label: "Neutral", emoji: "😐", value: 4, description: "Feeling neutral, neither good nor bad" },
  { label: "Content", emoji: "😊", value: 5, description: "Feeling positive, calm, or satisfied" },
  { label: "Joyful", emoji: "😄", value: 6, description: "Feeling very happy, energized, or fulfilled" },
];

export default function MoodSelector() {
  const { currentMood, setCurrentMood } = useWellnessStore();
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [isCrisisModeOpen, setIsCrisisModeOpen] = useState(false);
  const [currentMoodEntryId, setCurrentMoodEntryId] = useState<string | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    // Set initial mood in store if needed, or sync with it.
    const initialMood = moods.find(m => m.label === currentMood);
    if (!initialMood) {
        setCurrentMood("Neutral");
    }
  }, [currentMood, setCurrentMood]);

  const handleMoodSelect = async (mood: (typeof moods)[0]) => {
    setCurrentMood(mood.label);
    if (!user) return;

    try {
      const moodEntry = {
        mood: mood.label,
        value: mood.value,
        createdAt: serverTimestamp(),
      };
      
      const moodEntriesRef = collection(firestore, `userProfiles/${user.uid}`, "moodEntries");
      const docRef = await addDoc(moodEntriesRef, moodEntry);
      
      setCurrentMoodEntryId(docRef.id);

      if (mood.value === 1) { // Lowest mood score
        setIsCrisisModeOpen(true);
      } else {
        setIsTriggerModalOpen(true);
      }

    } catch (error) {
      console.error("Error logging mood:", error);
      toast({
        title: "Error",
        description: "Could not log your mood. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTriggerSave = async (trigger: string, note?: string) => {
    if (!user || !currentMoodEntryId) return;

    try {
        const moodEntryRef = doc(firestore, `userProfiles/${user.uid}/moodEntries`, currentMoodEntryId);
        const updateData: { trigger: string; triggerNote?: string } = { trigger };
        if (note) {
            updateData.triggerNote = note;
        }
        await updateDoc(moodEntryRef, updateData);

        toast({
            title: "Mood Logged",
            description: `You've logged your feeling as "${currentMood}".`,
        });
    } catch (error) {
        console.error("Error saving mood trigger:", error);
         toast({
            title: "Error",
            description: "Could not save the mood reason. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsTriggerModalOpen(false);
        setCurrentMoodEntryId(null);
    }
  }

  const handleCrisisDialogClose = (openTriggerModal: boolean) => {
    setIsCrisisModeOpen(false);
    if (openTriggerModal) {
      setIsTriggerModalOpen(true);
    } else {
      setCurrentMoodEntryId(null);
    }
  }

  return (
    <>
      <div className="flex justify-around items-end bg-card p-4 rounded-xl shadow-sm">
        {moods.map((mood) => (
          <button
            key={mood.label}
            onClick={() => handleMoodSelect(mood)}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-all group"
            aria-label={`Select mood: ${mood.label}`}
          >
            <span
              className={cn(
                "text-4xl sm:text-5xl grayscale transition-all duration-300 transform group-hover:scale-110 group-hover:-translate-y-2 group-hover:rotate-6",
                currentMood === mood.label && "grayscale-0 scale-125 -translate-y-1"
              )}
            >
              {mood.emoji}
            </span>
          </button>
        ))}
      </div>
      
      <div className="mt-8">
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Mood Metrics</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Use this guide to help identify your feelings.</p>
                <ul className="space-y-3">
                    {moods.map(mood => (
                        <li key={mood.value} className="flex items-start gap-3 text-sm">
                            <span className="text-xl w-6 text-center">{mood.emoji}</span>
                            <span>
                                <span className="font-semibold">{mood.label}</span> – {mood.description}
                            </span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </div>

      <MoodTriggerModal 
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        onSave={handleTriggerSave}
      />

      <CrisisModeDialog
        isOpen={isCrisisModeOpen}
        onClose={handleCrisisDialogClose}
      />
    </>
  );
}

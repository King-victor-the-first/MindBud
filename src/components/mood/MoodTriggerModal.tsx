
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const triggers = [
    "Academics", "Social Life", "Work/Career", "Relationships", "Finances", "Health", "Self-Esteem", "The Future", "Environment", "No Clear Reason"
];

type MoodTriggerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trigger: string, note?: string) => void;
};

export default function MoodTriggerModal({ isOpen, onClose, onSave }: MoodTriggerModalProps) {
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [otherNote, setOtherNote] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

  const handleTriggerSelect = (trigger: string) => {
    setSelectedTrigger(trigger);
    if (trigger === "Other") {
      setShowOtherInput(true);
    } else {
      setShowOtherInput(false);
      onSave(trigger);
    }
  };

  const handleSaveOther = () => {
    if (otherNote.trim()) {
      onSave("Other", otherNote.trim());
    }
  };
  
  const handleClose = () => {
    setSelectedTrigger(null);
    setShowOtherInput(false);
    setOtherNote("");
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What's the main reason for this feeling?</DialogTitle>
          <DialogDescription>
            Understanding your triggers is a key step in managing your well-being.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
            <div className="max-h-60 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {triggers.map(trigger => (
                        <Button 
                            key={trigger}
                            variant="outline"
                            className={cn("h-auto py-2", selectedTrigger === trigger && !showOtherInput && "bg-primary text-primary-foreground")}
                            onClick={() => handleTriggerSelect(trigger)}
                        >
                            {trigger}
                        </Button>
                    ))}
                     <Button 
                        variant="outline"
                        className={cn("h-auto py-2", showOtherInput && "bg-primary text-primary-foreground")}
                        onClick={() => handleTriggerSelect("Other")}
                    >
                        Other
                    </Button>
                </div>
            </div>

            {showOtherInput && (
                <div className="mt-4 space-y-2">
                    <Input 
                        placeholder="Please specify..."
                        value={otherNote}
                        onChange={(e) => setOtherNote(e.target.value)}
                        autoFocus
                    />
                    <Button onClick={handleSaveOther} className="w-full">Save Note</Button>
                </div>
            )}
        </div>

      </DialogContent>
    </Dialog>
  );
}


"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ScheduledSession } from "@/lib/types";
import { isToday, parse } from "date-fns";

const timeSlots = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "07:00 PM"];

export default function TherapyScheduler() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSchedule = () => {
    if (!date || !selectedTime) {
      toast({
        title: "Incomplete Selection",
        description: "Please select a date and time for your session.",
        variant: "destructive",
      });
      return;
    }

    const newSession: ScheduledSession = {
        id: crypto.randomUUID(),
        date: date.toISOString(),
        time: selectedTime,
    }

    try {
        const existingSessions: ScheduledSession[] = JSON.parse(localStorage.getItem("scheduledSessions") || "[]");
        
        const isAlreadyScheduled = existingSessions.some(
            session => new Date(session.date).toDateString() === new Date(newSession.date).toDateString() && session.time === newSession.time
        );

        if (isAlreadyScheduled) {
            toast({
                title: "Session Already Booked",
                description: "You already have a session at this time. Please choose another slot.",
                variant: "destructive",
            });
            return;
        }
        
        const updatedSessions = [...existingSessions, newSession];
        localStorage.setItem("scheduledSessions", JSON.stringify(updatedSessions));

        toast({
          title: "Session Scheduled!",
          description: `Your therapy session is booked for ${date.toLocaleDateString()} at ${selectedTime}.`,
        });
        setSelectedTime(null);

    } catch (error) {
        console.error("Failed to save session:", error);
        toast({
            title: "Scheduling Failed",
            description: "Could not save your session. Please try again.",
            variant: "destructive",
        });
    }
  };

  const now = new Date();

  return (
    <Card>
      <CardContent className="p-2 sm:p-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="flex-shrink-0 mx-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
                setDate(selectedDate);
                setSelectedTime(null); // Reset time when date changes
            }}
            className="rounded-md border"
            disabled={(date) => date < new Date(new Date().toDateString())}
          />
        </div>
        <div className="flex-1">
          <h3 className="font-headline text-xl mb-4">
            Available Times for{" "}
            <span className="text-primary">{date ? date.toLocaleDateString() : "..."}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {timeSlots.map((time) => {
              const sessionDateTime = date ? parse(time, "hh:mm a", new Date(date)) : new Date();
              const isPastTime = date && isToday(date) && sessionDateTime < now;

              return (
                <Button
                  key={time}
                  variant="outline"
                  className={cn(
                    "w-full",
                    selectedTime === time && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setSelectedTime(time)}
                  disabled={isPastTime}
                >
                  {time}
                </Button>
              )
            })}
          </div>
          <Button onClick={handleSchedule} className="w-full mt-6" size="lg" disabled={!selectedTime}>
            Schedule Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

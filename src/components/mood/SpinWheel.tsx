
"use client";

import { useState, useRef } from "react";
import { moodBoosters } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Gift, Loader2 } from "lucide-react";

const wheelTasks = moodBoosters.slice(0, 20);
const segmentAngle = 360 / wheelTasks.length;

const segmentColors = [
  "bg-green-200", "bg-teal-200", "bg-cyan-200", "bg-sky-200",
  "bg-blue-200", "bg-green-300", "bg-teal-300", "bg-cyan-300",
  "bg-sky-300", "bg-blue-300", "bg-green-400", "bg-teal-400",
  "bg-cyan-400", "bg-sky-400", "bg-blue-400", "bg-green-500",
  "bg-teal-500", "bg-cyan-500", "bg-sky-500", "bg-blue-500"
];

export default function SpinWheel() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = () => {
    if (isSpinning || !wheelRef.current) return;

    setIsSpinning(true);
    setResult(null);

    const randomExtraSpins = Math.floor(Math.random() * 3) + 5; // 5 to 7 full rotations
    const randomStopIndex = Math.floor(Math.random() * wheelTasks.length);
    const stopAngle = randomStopIndex * segmentAngle;
    
    // Calculate final rotation: current rotation + extra spins + angle to stop on the segment
    // The pointer is at the top (0 degrees), so we need to align the chosen segment there.
    // We add a bit of an offset to center the pointer within the segment.
    const finalRotation = rotation + (randomExtraSpins * 360) + (360 - stopAngle) - (segmentAngle / 2);
    
    setRotation(finalRotation);

    const spinDuration = 6000; // 6 seconds for the spin

    if(wheelRef.current) {
      wheelRef.current.style.transition = `transform ${spinDuration}ms cubic-bezier(.17,.93,.3,1)`;
      wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
    }

    setTimeout(() => {
      setResult(wheelTasks[randomStopIndex].text);
      setIsSpinning(false);
      // Optional: Reset transition after spin to allow for immediate re-spin without visual glitches
      if(wheelRef.current) {
        wheelRef.current.style.transition = 'none';
        // Normalize rotation to prevent excessively large numbers
        const normalizedRotation = finalRotation % 360;
        wheelRef.current.style.transform = `rotate(${normalizedRotation}deg)`;
        setRotation(normalizedRotation);
      }
    }, spinDuration);
  };

  const getButtonContent = () => {
    if (isSpinning) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Spinning...
        </>
      );
    }
    if (result) {
      return (
        <>
            <Play className="mr-2 h-4 w-4 fill-current" />
            Spin Again
        </>
      );
    }
    return (
      <>
        <Play className="mr-2 h-4 w-4 fill-current" />
        Spin the Wheel!
      </>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center mb-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-primary" />
        </div>

        <div
          ref={wheelRef}
          className="relative w-full h-full rounded-full border-4 border-muted shadow-lg overflow-hidden"
        >
          {wheelTasks.map((task, index) => {
            const Icon = task.icon;
            return (
              <div
                key={index}
                className={cn(
                  "absolute w-1/2 h-1/2 origin-bottom-right flex items-center justify-center",
                  segmentColors[index % segmentColors.length]
                )}
                style={{
                  transform: `rotate(${index * segmentAngle}deg)`,
                  clipPath: `polygon(0 0, 100% 0, 100% 100%)`
                }}
              >
                <div
                  className="flex flex-col items-center justify-center text-center"
                  style={{ transform: `rotate(${segmentAngle / 2}deg) translate(-50%, -98%) rotate(-90deg)` }}
                >
                  <Icon className="w-2.5 h-2.5 text-foreground/70" />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Center Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-card rounded-full border-4 border-muted shadow-inner z-10" />
      </div>

      <Button onClick={handleSpin} size="lg" className="rounded-full shadow-lg w-48" disabled={isSpinning}>
        {getButtonContent()}
      </Button>

      {!isSpinning && result && (
        <div className="mt-6 text-center bg-muted/50 p-4 rounded-lg shadow-md max-w-sm animate-in fade-in zoom-in-95">
          <Gift className="w-8 h-8 mx-auto text-primary mb-2" />
          <h3 className="font-headline text-lg font-semibold">Your happy task is:</h3>
          <p className="text-foreground mt-1">{result}</p>
        </div>
      )}
    </div>
  );
}

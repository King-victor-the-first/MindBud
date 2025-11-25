
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
  const [currentRotation, setCurrentRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = () => {
    if (isSpinning || !wheelRef.current) return;

    setIsSpinning(true);
    setResult(null);
    
    // Start the continuous animation
    wheelRef.current.style.transition = 'none';
    wheelRef.current.style.transform = `rotate(${currentRotation}deg)`;
    void wheelRef.current.offsetWidth; // Force reflow
    wheelRef.current.classList.add("animate-spin-continuous");

    // After a short time, decide where to stop
    setTimeout(() => {
        if (!wheelRef.current) return;

        const computedStyle = window.getComputedStyle(wheelRef.current);
        const transform = computedStyle.transform;
      
        let currentAngle = 0;
        if (transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            currentAngle = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
        }

        const randomExtraSpins = Math.floor(Math.random() * 2) + 4; // Spin 4-5 more times
        const randomStopIndex = Math.floor(Math.random() * wheelTasks.length);
        // Calculate the final angle to land on the chosen segment
        const finalAngle = currentAngle + (randomExtraSpins * 360) - (currentAngle % 360) - (randomStopIndex * segmentAngle) - (segmentAngle / 2);
        
        // Stop the continuous animation
        wheelRef.current.classList.remove("animate-spin-continuous");
        void wheelRef.current.offsetWidth; // Force reflow

        // Apply transition for slow-down effect
        wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.25, 1, 0.5, 1)';
        wheelRef.current.style.transform = `rotate(${finalAngle}deg)`;
        
        setCurrentRotation(finalAngle);
        
        // After the slow-down transition ends, set the result
        setTimeout(() => {
            setResult(wheelTasks[randomStopIndex].text);
            setIsSpinning(false);
        }, 4000); // Corresponds to the transition duration

    }, 200); // Start the stopping sequence after 200ms
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
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[30px] border-b-primary" />
        </div>

        <div
          ref={wheelRef}
          className={cn(
            "relative w-full h-full rounded-full border-4 border-muted shadow-lg overflow-hidden",
            isSpinning && 'animate-pulse-glow'
          )}
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

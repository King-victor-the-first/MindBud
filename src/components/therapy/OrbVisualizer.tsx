'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface OrbVisualizerProps {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  volume: number;
}

export function OrbVisualizer({
  isConnected,
  isConnecting,
  isSpeaking,
  volume,
}: OrbVisualizerProps) {
  const scale = isConnected
    ? 1 + Math.min(volume * 5, 2)
    : isConnecting
    ? 0.9
    : 1;

  const backgroundColor = isSpeaking
    ? 'hsl(var(--primary))'
    : 'rgba(100, 100, 150, 0.2)';

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Base Orb */}
      <motion.div
        className="absolute w-full h-full rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(100, 116, 139, 0.1) 0%, rgba(100, 116, 139, 0) 70%)',
        }}
        animate={{ scale: isConnected ? [1, 1.05, 1] : 1 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main Visualizer Orb */}
      <motion.div
        className="w-32 h-32 rounded-full shadow-2xl"
        style={{
          backgroundColor,
          boxShadow: isSpeaking
            ? `0 0 40px 10px hsl(var(--primary) / 0.5)`
            : `0 0 20px 5px rgba(100, 116, 139, 0.2)`,
        }}
        animate={{ scale }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      />

      {/* Connecting Spinner */}
      {isConnecting && (
        <motion.div
          className="absolute w-full h-full border-2 border-primary/50 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  );
}

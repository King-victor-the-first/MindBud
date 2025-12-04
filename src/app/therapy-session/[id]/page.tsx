'use client';

import { Button } from '@/components/ui/button';
import { OrbVisualizer } from '@/components/therapy/OrbVisualizer';
import { useLiveSession } from '@/hooks/useLiveSession';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft, BrainCircuit } from 'lucide-react';

export default function LiveTherapyPage() {
  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    isSpeaking,
    volume,
    transcript,
    error,
  } = useLiveSession();

  const getStatusText = () => {
    if (error) return error;
    if (isConnecting) return 'Connecting...';
    if (isSpeaking) return 'AI is speaking...';
    if (isConnected) return 'Connected. Listening...';
    return 'Ready to connect.';
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 text-white overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-20 p-2 border-b border-white/10 flex-shrink-0 bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" passHref>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-lg font-headline font-bold">Live AI Session</h1>
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <BrainCircuit className="w-3 h-3 text-primary" />
              Powered by Gemini
            </p>
          </div>
          <div className="w-10 h-10" />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative pt-16">
        <OrbVisualizer
          isConnecting={isConnecting}
          isConnected={isConnected}
          isSpeaking={isSpeaking}
          volume={volume}
        />
        <div className="mt-8 text-lg text-gray-200 h-12 flex items-center justify-center transition-all">
          <p>{getStatusText()}</p>
        </div>

        <div className="absolute bottom-32 left-4 right-4 text-center h-24 overflow-hidden">
          <p className="text-xl transition-opacity duration-300">
            {transcript}
          </p>
        </div>
      </div>

      <div className="bg-black/30 p-4 flex justify-center items-center gap-4 border-t border-white/10">
        {!isConnected && !isConnecting ? (
          <Button
            onClick={connect}
            size="lg"
            className="bg-green-500 hover:bg-green-600 rounded-full w-48"
          >
            Connect
          </Button>
        ) : (
          <Button
            onClick={disconnect}
            size="lg"
            variant="destructive"
            className="rounded-full w-48"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isConnecting ? 'Connecting...' : 'Disconnect'}
          </Button>
        )}
      </div>
    </div>
  );
}

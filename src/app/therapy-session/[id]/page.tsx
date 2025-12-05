
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { OrbVisualizer } from '@/components/therapy/OrbVisualizer';
import { useLiveSession } from '@/hooks/useLiveSession';
import { Loader2, ArrowLeft, BrainCircuit, Mic, Phone, MessageSquare, Mic2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import TextTherapyClient from '@/components/therapy/TextTherapyClient';

export default function TherapySessionPage() {
  const [mode, setMode] = useState<'voice' | 'text'>('text');
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

  const VoiceUI = (
    <>
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
            className="bg-primary hover:bg-primary/90 rounded-full w-48 h-16 text-lg"
          >
            <Mic className="mr-2 h-6 w-6" />
            Connect
          </Button>
        ) : (
          <Button
            onClick={disconnect}
            size="lg"
            variant="destructive"
            className="rounded-full w-48 h-16 text-lg"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : <Phone className="mr-2 h-6 w-6" />}
            {isConnecting ? 'Connecting...' : 'Disconnect'}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 text-white overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-20 p-2 flex-shrink-0 bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <Link href="/dashboard" passHref>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="flex items-center justify-center p-1 bg-black/20 rounded-full border border-white/10">
            <Button 
                variant={mode === 'text' ? 'secondary' : 'ghost'} 
                onClick={() => setMode('text')}
                className="rounded-full h-8 px-4"
            >
                <MessageSquare className="w-4 h-4"/>
            </Button>
            <Button 
                variant={mode === 'voice' ? 'secondary' : 'ghost'} 
                onClick={() => setMode('voice')}
                className="rounded-full h-8 px-4"
            >
                 <Mic2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-10 h-10" /> 
        </div>
      </header>

      {mode === 'voice' ? VoiceUI : <TextTherapyClient isImmersive={true} />}
      
    </div>
  );
}

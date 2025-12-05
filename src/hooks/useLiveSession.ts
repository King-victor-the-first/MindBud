
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import {
  createPcmBlob,
  decodeAudioData,
} from '@/lib/audioHelpers';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

export function useLiveSession() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null); // Live content session
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);


  const initializeAudio = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        // If context exists and is not closed, we can reuse it.
    } else {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (mediaStreamRef.current) return; // Already initialized

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Using a buffer size of 1024 for a balance between latency and performance
      const processor = audioContextRef.current.createScriptProcessor(1024, 1, 1);
      processor.onaudioprocess = (e) => {
        if (sessionRef.current && sessionRef.current.isOpen) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = createPcmBlob(inputData);
          sessionRef.current.sendRealtimeInput(pcmBlob);

          // Calculate volume for visualizer
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          setVolume(rms);
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
    } catch (err) {
      console.error('Error getting media stream:', err);
      setError('Microphone access denied. Please enable it in your browser settings.');
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
     if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
     if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
    }
    // Final state cleanup
    setIsConnected(false);
    setIsConnecting(false);
    setTranscript('');
    setVolume(0);
  }, []);

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError('FATAL: Gemini API Key is not configured.');
      console.error('Missing NEXT_PUBLIC_GEMINI_API_KEY');
      setIsConnecting(false);
      return;
    }

    setIsConnecting(true);
    setError(null);
    setTranscript('');

    try {
      await initializeAudio();
      
      const ai = new GoogleGenAI({ apiKey });
      const session = await ai.live.connect({
        model: MODEL_NAME,
      });
      sessionRef.current = session;

      // IMPORTANT: Define event handlers BEFORE the connection is established
      // to avoid race conditions where events fire before listeners are attached.
      session.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
      };

      session.onmessage = async (msg) => {
        if (msg.type === 'transcript') {
          setTranscript(msg.text);
        } else if (msg.type === 'audio') {
           if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
             console.log("Audio context not ready, re-initializing.");
             await initializeAudio();
           }
           if (!audioContextRef.current) return;

          const audio = await decodeAudioData(
            msg.data,
            audioContextRef.current
          );
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audio;
          source.connect(audioContextRef.current.destination);
          setIsSpeaking(true);
          source.start();
          source.onended = () => setIsSpeaking(false);
        }
      };

      session.onclose = () => {
        disconnect(); // Use the centralized disconnect function for cleanup
      };

      session.onerror = (e) => {
        console.error('Session error:', e);
        setError('A connection error occurred.');
        disconnect();
      };

    } catch (err) {
      console.error('Connection failed:', err);
      setError('Failed to connect. Please check permissions and try again.');
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, initializeAudio, disconnect]);

  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    isSpeaking,
    volume,
    transcript,
    error,
  };
}

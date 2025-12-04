'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  arrayBufferToBase64,
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

  const initializeAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    if (mediaStreamRef.current) return; // Already initialized

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(1024, 1, 1);
      processor.onaudioprocess = (e) => {
        if (sessionRef.current && sessionRef.current.isOpen) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = createPcmBlob(inputData);
          sessionRef.current.sendRealtimeInput(pcmBlob);

          // Calculate volume
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

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setError(null);
    setTranscript('');

    try {
      await initializeAudio();
      
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Missing Gemini API Key.');
      }
      const ai = new GoogleGenerativeAI(apiKey);
      const session = await ai.live.connect({
        model: MODEL_NAME,
      });
      sessionRef.current = session;

      session.onmessage = async (msg) => {
        if (msg.type === 'transcript') {
          setTranscript(msg.text);
        } else if (msg.type === 'audio') {
          const audio = await decodeAudioData(
            msg.data,
            audioContextRef.current!
          );
          const source = audioContextRef.current!.createBufferSource();
          source.buffer = audio;
          source.connect(audioContextRef.current!.destination);
          setIsSpeaking(true);
          source.start();
          source.onended = () => setIsSpeaking(false);
        }
      };

      session.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
      };

      session.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        // Clean up audio resources on close
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
      };

      session.onerror = (e) => {
        console.error('Session error:', e);
        setError('A connection error occurred.');
        setIsConnected(false);
        setIsConnecting(false);
      };
    } catch (err) {
      console.error('Connection failed:', err);
      setError('Failed to connect. Please check permissions and configuration.');
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, initializeAudio]);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    // State updates are handled by onclose handler
  }, []);
  
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


'use client';

import { useState, useRef, useCallback } from 'react';
import OpenAI from 'openai';
import { SYSTEM_INSTRUCTION } from '../lib/constants'; // Reuse your system instruction

export interface Message {
  id: string;
  role: 'user' | 'assistant'; // OpenAI uses 'assistant' instead of 'model'
  text: string;
  timestamp: Date;
}

export const useOpenAIChatSession = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openaiRef = useRef<OpenAI | null>(null);

  const initializeOpenAI = useCallback(() => {
    if (!openaiRef.current) {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY; // Ensure this is in your .env
      if (!apiKey) {
        setError("OpenAI API Key not found.");
        return;
      }

      openaiRef.current = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage (use backend proxy in production)
      });
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    initializeOpenAI();
    // 1. Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    try {
      if (!openaiRef.current) throw new Error("OpenAI session not initialized");
      // 2. Prepare History for API
      // We map our local message state to the format OpenAI expects
      const apiMessages = [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...messages.map(m => ({ 
            role: m.role, 
            content: m.text 
        })),
        { role: "user", content: text }
      ];
      // 3. Create Stream
      const stream = await openaiRef.current.chat.completions.create({
        model: "gpt-4o", // Or "gpt-3.5-turbo"
        messages: apiMessages as any,
        stream: true,
      });
      
      const botMessageId = (Date.now() + 1).toString();
      let botText = "";
      // 4. Add Placeholder Bot Message
      setMessages((prev) => [
        ...prev, 
        { id: botMessageId, role: 'assistant', text: '', timestamp: new Date() }
      ]);
      // 5. Consume Stream
      for await (const chunk of stream) {
        const chunkText = chunk.choices[0]?.delta?.content || "";
        if (chunkText) {
          botText += chunkText;
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === botMessageId ? { ...msg, text: botText } : msg
            )
          );
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [initializeOpenAI, messages]); // Dependencies update

  return { messages, sendMessage, isLoading, error };
};

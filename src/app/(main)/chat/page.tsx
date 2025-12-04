
'use client';

import { useEffect, useState } from 'react';
import ChatInterface from "@/components/chat/ChatInterface";
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs on the client, so window.crypto is available.
    setSessionId(crypto.randomUUID());
  }, []);


  useEffect(() => {
    if (user) {
      const userProfileRef = doc(firestore, `userProfiles/${user.uid}`);
      updateDocumentNonBlocking(userProfileRef, {
        lastSupportChatVisit: serverTimestamp(),
      });
    }
  }, [user, firestore]);

  const handleStartVoiceSession = () => {
    if (sessionId) {
      router.push(`/therapy-session/${sessionId}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-muted/20">
      <ChatInterface onStartVoiceSession={handleStartVoiceSession} />
    </div>
  );
}


'use client';

import { useEffect } from 'react';
import ChatInterface from "@/components/chat/ChatInterface";
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

export default function ChatPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (user) {
      const userProfileRef = doc(firestore, `userProfiles/${user.uid}`);
      updateDocumentNonBlocking(userProfileRef, {
        lastSupportChatVisit: serverTimestamp(),
      });
    }
  }, [user, firestore]);

  return (
    <div className="h-screen flex flex-col bg-muted/20">
      <ChatInterface />
    </div>
  );
}

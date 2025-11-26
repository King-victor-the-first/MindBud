
'use client';

import { useEffect } from 'react';
import ChatInterface from "@/components/chat/ChatInterface";
import { ShieldCheck } from "lucide-react";
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
    <div className="h-full flex flex-col">
       <div className="sticky top-0 z-10 p-4 border-b flex-shrink-0 bg-background">
        <h1 className="text-2xl font-headline font-bold text-center">Support Circle</h1>
        <p className="text-sm text-muted-foreground text-center mt-1 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Anonymous & Moderated Group Chat
        </p>
       </div>
      <ChatInterface />
    </div>
  );
}

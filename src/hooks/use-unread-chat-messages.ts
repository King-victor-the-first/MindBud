
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { UserProfile, ChatMessage } from '@/lib/types';
import { doc } from 'firebase/firestore';

/**
 * A custom hook to count unread messages in the group chat.
 * @returns The number of unread messages.
 */
export function useUnreadChatMessages(): number {
  const { user } = useUser();
  const firestore = useFirestore();
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Get the user's profile to find their last visit time
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const lastVisitTimestamp = userProfile?.lastSupportChatVisit;

  // 2. Query messages created after the last visit time
  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!user || !lastVisitTimestamp) {
        // If we don't have a last visit time, we can't query for unread messages.
        // We could query all messages, but that might be too much data initially.
        // A better approach is to wait until the timestamp is available.
        return null;
    }
    return query(
      collection(firestore, 'groupChatMessages'),
      where('createdAt', '>', lastVisitTimestamp)
    );
  }, [user, firestore, lastVisitTimestamp]);

  const { data: unreadMessages } = useCollection<ChatMessage>(unreadMessagesQuery);
  
  // 3. Update the count whenever the query result changes
  useEffect(() => {
    // If the query is not active (e.g., no lastVisitTimestamp), the count is 0.
    if (!unreadMessagesQuery) {
        // Special case: if there's no last visit timestamp, maybe all messages are unread?
        // Let's check all messages to get an initial count.
         const allMessagesQuery = query(collection(firestore, 'groupChatMessages'));
         // This is a one-time fetch inside an effect, not a real-time subscription.
         // A better implementation would use a subscription, but this avoids hook complexity for now.
         // This part will only run once when the user has never visited the chat before.
         const fetchAll = async () => {
             const { getDocs } = await import('firebase/firestore');
             const snapshot = await getDocs(allMessagesQuery);
             setUnreadCount(snapshot.size);
         }
         if(!lastVisitTimestamp && user) {
            fetchAll();
         } else {
            setUnreadCount(0);
         }
        return;
    }

    if (unreadMessages) {
      // We also filter out the user's own messages from the unread count
      const count = unreadMessages.filter(msg => msg.userId !== user?.uid).length;
      setUnreadCount(count);
    } else {
      setUnreadCount(0);
    }
  }, [unreadMessages, unreadMessagesQuery, user, lastVisitTimestamp, firestore]);

  return unreadCount;
}

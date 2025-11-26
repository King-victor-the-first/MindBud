
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { UserProfile, ChatMessage } from '@/lib/types';
import { doc } from 'firebase/firestore';

interface UnreadMessagesInfo {
  count: number;
  hasMention: boolean;
}

/**
 * A custom hook to count unread messages and check for mentions in the group chat.
 * @returns An object with the count of unread messages and a boolean indicating if there's a mention.
 */
export function useUnreadChatMessages(): UnreadMessagesInfo {
  const { user } = useUser();
  const firestore = useFirestore();
  const [unreadInfo, setUnreadInfo] = useState<UnreadMessagesInfo>({ count: 0, hasMention: false });

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
        return null;
    }
    return query(
      collection(firestore, 'groupChatMessages'),
      where('createdAt', '>', lastVisitTimestamp)
    );
  }, [user, firestore, lastVisitTimestamp]);

  const { data: unreadMessages } = useCollection<ChatMessage>(unreadMessagesQuery);
  
  // 3. Update the count and mention status whenever the query result changes
  useEffect(() => {
    if (!unreadMessagesQuery) {
        const fetchInitialCount = async () => {
             if (!user) {
                setUnreadInfo({ count: 0, hasMention: false });
                return;
             }
             // For a user who has never visited, all messages might be considered unread.
             // To avoid overwhelming them, we can limit this initial check or simply start from zero.
             // For this implementation, we will assume a fresh start means no "unread" messages until they visit.
             setUnreadInfo({ count: 0, hasMention: false });
        }
        fetchInitialCount();
        return;
    }

    if (unreadMessages && user) {
      const filteredMessages = unreadMessages.filter(msg => msg.userId !== user.uid);
      const count = filteredMessages.length;
      const hasMention = filteredMessages.some(msg => msg.mentions?.includes(user.uid));
      setUnreadInfo({ count, hasMention });
    } else {
      setUnreadInfo({ count: 0, hasMention: false });
    }
  }, [unreadMessages, unreadMessagesQuery, user]);

  return unreadInfo;
}

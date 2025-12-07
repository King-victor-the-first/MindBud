
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { getDatabase, ref, onValue, onDisconnect, set, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * A custom hook to manage a user's online presence status in both
 * Firestore (for persistence) and Realtime Database (for real-time updates).
 */
export function usePresence() {
  const { user } = useUser();
  const firestore = useFirestore();
  const isOnlineRef = useRef(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Get a reference to the Realtime Database
    const rtdb = getDatabase();
    const myPresenceRef = ref(rtdb, `.info/connected`);
    const userStatusFirestoreRef = doc(firestore, 'userProfiles', user.uid);
    const userRtdbStatusRef = ref(rtdb, `status/${user.uid}`);

    const onOnlineStatusChange = (snapshot: any) => {
      const isOnline = snapshot.val();
      if (isOnline === isOnlineRef.current) {
        return; // No change in online status
      }

      isOnlineRef.current = isOnline;

      // Use onDisconnect to set the user's status to offline when they disconnect.
      // This is the most reliable way to catch browser closes.
      onDisconnect(userRtdbStatusRef).set({
        state: 'offline',
        lastChanged: rtdbServerTimestamp(),
      }).catch((err) => {
        console.error('Could not establish onDisconnect event', err);
      });

      // Set the user's online status in the Realtime Database.
      set(userRtdbStatusRef, {
        state: 'online',
        lastChanged: rtdbServerTimestamp(),
      });
      
      // Also update Firestore for persistent "last seen" status.
      updateDocumentNonBlocking(userStatusFirestoreRef, {
         presence: {
            state: 'online',
            lastChanged: serverTimestamp(),
        }
      });
    };

    const rtdbListener = onValue(myPresenceRef, onOnlineStatusChange);

    // Also listen for document visibility changes
    const handleVisibilityChange = () => {
      if (!user) return; // Guard against calls after logout
      if (document.visibilityState === 'hidden') {
         updateDocumentNonBlocking(userStatusFirestoreRef, {
            presence: {
                state: 'offline',
                lastChanged: serverTimestamp(),
            }
        });
      } else {
        // When the tab becomes visible again, mark as online.
        updateDocumentNonBlocking(userStatusFirestoreRef, {
            presence: {
                state: 'online',
                lastChanged: serverTimestamp(),
            }
        });
        set(userRtdbStatusRef, {
            state: 'online',
            lastChanged: rtdbServerTimestamp(),
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        // Cleanup listeners
        rtdbListener();
        document.removeEventListener('visibilitychange', handleVisibilityChange);

        // RTDB onDisconnect will handle setting the status to offline when the client
        // connection is lost. We don't need to manually set it to offline here,
        // as doing so during a logout can cause a race condition where the user
        // is already unauthenticated, leading to a permission error.
    };
  }, [user, firestore]);
}

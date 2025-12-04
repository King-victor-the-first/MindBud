'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import BottomNavBar from '@/components/shared/BottomNavBar';
import Sidebar from '@/components/shared/Sidebar';
import { Loader2 } from 'lucide-react';
import { usePresence } from '@/hooks/use-presence';
import { cn } from '@/lib/utils';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // Use presence hook for any authenticated user within this layout.
  usePresence();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Determine if the current page should hide the main layout's navbars.
  const isImmersivePage = pathname.startsWith('/chat');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className={cn(
        "flex-1 md:ml-64",
        isImmersivePage ? "pb-0" : "md:pb-0 pb-28" 
      )}>
        {children}
      </main>
      {/* Conditionally render the BottomNavBar */}
      {!isImmersivePage && <BottomNavBar />}
    </div>
  );
}

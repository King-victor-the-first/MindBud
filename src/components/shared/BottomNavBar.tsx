
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Smile, ClipboardList, Bot, Settings, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import SiriWave from './SiriWave';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '../ui/button';
import { useUnreadChatMessages } from '@/hooks/use-unread-chat-messages';
import { Badge } from '../ui/badge';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/mood', label: 'Mood', icon: Smile },
  { href: '/therapy', label: 'Therapy', icon: 'siri' },
  { href: '/insights', label: 'Insights', icon: LineChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const unreadCount = useUnreadChatMessages();

  return (
    <footer className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <nav className="max-w-md mx-auto grid grid-cols-5 items-center h-16 bg-card/95 backdrop-blur-sm border border-border/80 rounded-full shadow-lg">
        {navItems.map((item) => {
          const isActive = (item.href === '/insights' && (pathname.startsWith('/insights') || pathname.startsWith('/activities'))) || (pathname.startsWith(item.href) && item.href !== '/insights') || (item.href === '/therapy' && pathname.startsWith('/chat'));
          if (item.icon === 'siri') {
            return (
              <div key={item.href} className="flex justify-center" style={{ gridColumn: '3' }}>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="relative flex items-center justify-center w-16 h-16 -translate-y-4 bg-card rounded-full shadow-lg border-2 border-primary mx-auto"
                      aria-label="Open Conversation Hub"
                    >
                       {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 justify-center rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                      <SiriWave isActive={isActive} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 mb-2">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Conversation Hub</h4>
                        <p className="text-sm text-muted-foreground">
                          Connect with your AI or the community.
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Link href="/therapy" passHref>
                           <Button variant={pathname.startsWith('/therapy') ? "default" : "outline"} className="w-full justify-start">AI Therapy Session</Button>
                        </Link>
                        <Link href="/chat" passHref>
                          <div className="relative w-full">
                             <Button variant={pathname.startsWith('/chat') ? "default" : "outline"} className="w-full justify-start">
                               Support Circle
                              </Button>
                              {unreadCount > 0 && (
                                <Badge variant="destructive" className="absolute top-1/2 -translate-y-1/2 right-2 h-5 w-5 p-0 justify-center rounded-full">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                              )}
                           </div>
                        </Link>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            );
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 h-full transition-colors duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}


'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Smile, ClipboardList, Bot, LogOut, Settings, Shield, LineChart, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { type UserProfile } from '@/lib/types';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { useUnreadChatMessages } from '@/hooks/use-unread-chat-messages';
import { Badge } from '../ui/badge';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/mood', label: 'Mood Tracking', icon: Smile },
  { 
    href: '/therapy', 
    label: 'Conversation Hub', 
    icon: Bot,
    subItems: [
        { href: '/therapy', label: 'AI Therapy Session' },
        { href: '/chat', label: 'Support Circle' }
    ]
  },
  { href: '/insights', label: 'Insights', icon: LineChart },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/apply-buddy', label: 'Become a Mind Buddy', icon: HeartHandshake },
];

const adminNavItem = { href: '/admin', label: 'Admin', icon: Shield };

// Designated super admin UID for failsafe access
const SUPER_ADMIN_UID = 'BzsBHchaPEYuHwuhqlMiwRaMbBJ2';

export default function Sidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { count: unreadCount, hasMention } = useUnreadChatMessages();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "userProfiles", user.uid);
  }, [firestore, user]);
  
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const isModerator = userProfile?.isModerator === true;
  const isSuperAdmin = user?.uid === SUPER_ADMIN_UID;

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const getUsername = () => {
    if (userProfile?.username) {
        return userProfile.username;
    }
    if (user?.displayName) {
        return user.displayName.split(' ')[0];
    }
    return "User";
  };
  
  const getInitials = () => {
    if (userProfile?.username) {
        return userProfile.username.substring(0, 2).toUpperCase();
    }
    if (user && user.displayName) {
        return user.displayName.split(' ').map(n => n[0]).join('');
    }
    return "U";
  }

  const getRoleText = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isModerator) return "Moderator";
    return null;
  }

  const allNavItems = isModerator ? [...navItems, adminNavItem] : navItems;
  const roleText = getRoleText();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen p-4 bg-card border-r fixed top-0 left-0 sidebar-background-pattern">
        <div className="flex items-center justify-between">
            <Logo />
        </div>

        <nav className="flex flex-col mt-8 space-y-1 flex-1">
            {allNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                if (item.subItems) {
                    const isSubActive = item.subItems.some(sub => pathname.startsWith(sub.href));
                    return (
                        <Collapsible key={item.href} defaultOpen={isSubActive}>
                            <CollapsibleTrigger className='w-full'>
                                <div className={cn(
                                    'flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors duration-200 w-full',
                                    isSubActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}>
                                    <div className='flex items-center gap-3'>
                                        <Icon className="w-5 h-5" strokeWidth={isSubActive ? 2.5 : 2} />
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                    <ChevronRight className='w-4 h-4 transition-transform [&[data-state=open]]:rotate-90' />
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className='pl-8 pt-1 space-y-1'>
                                {item.subItems.map(subItem => {
                                    const isSubItemActive = pathname.startsWith(subItem.href);
                                    const isChat = subItem.href === '/chat';
                                    return (
                                        <Link
                                            key={subItem.href}
                                            href={subItem.href}
                                            className={cn(
                                                'relative flex items-center gap-3 px-4 py-1.5 rounded-md transition-colors duration-200 text-sm',
                                                isSubItemActive
                                                ? 'text-primary font-semibold'
                                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                            )}
                                            >
                                            {subItem.label}
                                            {isChat && unreadCount > 0 && (
                                              <Badge variant="destructive" className="absolute top-1/2 -translate-y-1/2 right-2 h-6 min-w-[1.5rem] px-1.5 flex items-center justify-center rounded-full text-xs">
                                                {hasMention && '@'}{unreadCount > 99 ? '99+' : unreadCount}
                                              </Badge>
                                            )}
                                        </Link>
                                    )
                                })}
                            </CollapsibleContent>
                        </Collapsible>
                    )
                }

                return (
                    <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200',
                        (isActive && item.href !== '/dashboard' && !pathname.startsWith('/dashboard/')) || (pathname === '/dashboard' && item.href === '/dashboard')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </nav>

        <div className="mt-auto space-y-4">
            <ThemeToggle />
             <div className="flex items-center justify-between border-t pt-4">
                <div className='flex items-center gap-3'>
                  <Avatar className="h-10 w-10">
                    {user?.photoURL ? (
                        <AvatarImage src={user.photoURL} alt="User Avatar" />
                    ) : (
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                      <p className="font-semibold text-sm">{getUsername()}</p>
                      {roleText && <p className="text-xs text-muted-foreground">{roleText}</p>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="w-5 h-5 text-muted-foreground" />
                </Button>
            </div>
        </div>
    </aside>
  );
}

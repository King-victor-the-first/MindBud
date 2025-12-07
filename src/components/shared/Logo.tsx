import Link from 'next/link';
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Logo({ className }: { className?: string }) {
  const appLogo = PlaceHolderImages.find(p => p.id === 'app-logo');

  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      {appLogo ? (
         <Image src={appLogo.imageUrl} alt="MindBud Logo" width={32} height={32} data-ai-hint={appLogo.imageHint} />
      ) : (
        <div className="w-8 h-8 bg-muted rounded-full" />
      )}
      <span className="font-headline text-xl font-bold text-primary group-hover:text-primary/90 transition-colors">MindBud</span>
    </Link>
  );
}

import SettingsForm from "@/components/settings/SettingsForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <div>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-headline font-bold">Your Profile</h1>
                <p className="text-muted-foreground mt-1">Manage your account details.</p>
            </div>
            <SettingsForm />
        </div>

        <Separator />
        
        <div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HeartHandshake className="w-6 h-6 text-primary"/>
                        Become a Mind Buddy
                    </CardTitle>
                    <CardDescription>
                        Are you a licensed therapist or mental health professional? Join our community of Mind Buddies to volunteer your time and support others.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/settings/apply-buddy" passHref>
                        <Button>
                            Learn More & Apply
                            <ArrowRight className="ml-2 w-4 h-4"/>
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}

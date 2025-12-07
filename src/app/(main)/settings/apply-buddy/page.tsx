import BuddyApplicationForm from "@/components/settings/BuddyApplicationForm";
import { Card, CardContent } from "@/components/ui/card";

export default function ApplyBuddyPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-headline font-bold">Mind Buddy Application</h1>
        <p className="text-muted-foreground mt-1">
            Join our team of volunteer professionals and make a difference.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
            <BuddyApplicationForm />
        </CardContent>
      </Card>
    </div>
  );
}

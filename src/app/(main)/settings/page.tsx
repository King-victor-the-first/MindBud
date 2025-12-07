import SettingsForm from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <div>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-headline font-bold">Your Profile & Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account details and preferences.</p>
            </div>
            <SettingsForm />
        </div>
      </div>
    </div>
  );
}


import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
             <Link href="/dashboard" passHref>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Back to App
                </Button>
            </Link>
        </div>
      <div className="prose dark:prose-invert max-w-none">
        <h1 className="text-3xl font-headline font-bold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <h2 className="font-headline">1. Introduction</h2>
        <p>
          Welcome to MindBud ("we," "our," "us"). These Terms of Service govern your use of our application and services. By accessing or using our service, you agree to be bound by these terms.
        </p>

        <h2 className="font-headline">2. Service Description</h2>
        <p>
          MindBud is a mental wellness companion that provides AI-powered conversational support, mood tracking, and other wellness tools. Our services are designed to support your mental well-being but are not a substitute for professional medical advice, diagnosis, or treatment.
        </p>

        <h2 className="font-headline">3. User Data and Privacy</h2>
        <p>
          Your privacy is critically important to us. We are committed to protecting your personal information.
        </p>
        <ul>
          <li>
            <strong>Data We Collect:</strong> We collect information you provide, such as mood entries, journal entries, and activity logs. Conversations with our AI are processed to provide responses but are handled with strict privacy controls.
          </li>
          <li>
            <strong>How We Use Your Data:</strong> Your data is used to provide and improve the service. We use it to personalize your experience, generate insights into your well-being, and enhance the functionality of our AI. This allows us to create a more effective and supportive tool for you.
          </li>
          <li>
            <strong>We Do Not Sell Your Data:</strong> We will never sell, rent, or share your personal, identifiable information with third-party marketers or advertisers. Your data is for your benefit within the MindBud app.
          </li>
        </ul>

        <h2 className="font-headline">4. User Responsibilities</h2>
        <ul>
          <li>You are responsible for maintaining the confidentiality of your account information.</li>
          <li>You agree not to use the service for any illegal or unauthorized purpose.</li>
          <li>This service is not intended for use in a crisis. If you are experiencing a mental health crisis, please contact the 988 Suicide & Crisis Lifeline or your local emergency services immediately.</li>
        </ul>

        <h2 className="font-headline">5. Disclaimer of Warranties</h2>
        <p>
          The service is provided "as is" and "as available" without any warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free. The AI may produce inaccurate or unintended information.
        </p>

        <h2 className="font-headline">6. Limitation of Liability</h2>
        <p>
          In no event shall MindBud be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the service.
        </p>

        <h2 className="font-headline">7. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms of Service on this page.
        </p>
      </div>
    </div>
  );
}

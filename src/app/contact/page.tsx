
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const salesEmail = "victorehebhoria@gmail.com";
  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8 min-h-screen flex flex-col justify-center">
        <div className="absolute top-8">
             <Link href="/" passHref>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Back to Home
                </Button>
            </Link>
        </div>
        <Card>
            <CardHeader className="text-center">
                <h1 className="text-3xl font-headline font-bold">Contact Our Team</h1>
                <p className="text-muted-foreground pt-2">
                    We're excited to partner with you to support your team's mental wellness.
                </p>
            </CardHeader>
            <CardContent className="text-center">
                <p className="mb-4">
                    For all business and corporate partnership inquiries, please reach out to our sales team at the email address below.
                </p>
                 <a href={`mailto:${salesEmail}?subject=MindBud%20for%20Business%20Inquiry`}>
                    <Button size="lg">
                        <Mail className="mr-2 h-5 w-5" />
                        {salesEmail}
                    </Button>
                </a>
                <p className="text-sm text-muted-foreground mt-6">
                    We typically respond within 24-48 business hours. We look forward to hearing from you!
                </p>
            </CardContent>
        </Card>
    </div>
  );
}

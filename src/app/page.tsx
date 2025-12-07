
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { ArrowRight, Bot, Users, BarChart2, ShieldCheck, Briefcase, Zap } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto h-20 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="#features">Features</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#pricing">Plans</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto grid lg:grid-cols-2 gap-12 items-center py-20 sm:py-32">
          <div className="space-y-6 text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-headline font-bold text-primary">
              Your Proactive Partner in Mental Wellness
            </h1>
            <p className="text-lg text-muted-foreground">
              MindBud is a dedicated mental wellness companion offering immediate, AI-powered support and tools to help you proactively manage your well-being.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" asChild>
                <Link href="/login">
                  Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#pricing">Explore Plans</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <Image 
              src="https://picsum.photos/seed/mind-hero/600/400"
              alt="A person finding a moment of calm and clarity"
              width={600}
              height={400}
              className="rounded-xl shadow-2xl"
              data-ai-hint="calm clarity"
            />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted py-20">
          <div className="container mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl lg:text-4xl font-headline font-bold">A Toolkit for Your Mind</h2>
              <p className="text-lg text-muted-foreground mt-4">
                Everything you need to understand your feelings, build healthy habits, and find support.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Bot className="w-8 h-8 text-primary" />}
                title="AI Voice Therapist"
                description="Engage in supportive, confidential voice conversations with our empathetic AI, available 24/7."
              />
              <FeatureCard
                icon={<Users className="w-8 h-8 text-primary" />}
                title="Anonymous Peer Support"
                description="Connect with others in a safe, moderated group chat. You are not alone."
              />
              <FeatureCard
                icon={<BarChart2 className="w-8 h-8 text-primary" />}
                title="Wellness Tracking"
                description="Log your mood, activities, and sleep to uncover patterns and gain valuable insights into your well-being."
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="container mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl lg:text-4xl font-headline font-bold">Find the Right Plan for You</h2>
              <p className="text-lg text-muted-foreground mt-4">
                Whether you're an individual or a company, MindBud has a solution to support mental wellness.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* B2C Plan */}
              <div className="border-2 border-primary rounded-xl p-8 flex flex-col shadow-lg">
                <h3 className="text-2xl font-headline font-bold">For Individuals</h3>
                <p className="text-muted-foreground mb-6">Free access to core wellness tools.</p>
                <div className="text-4xl font-bold mb-6">
                  $0 <span className="text-lg font-normal text-muted-foreground">/ month</span>
                </div>
                <ul className="space-y-4 text-muted-foreground mb-8 flex-1">
                  <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-green-500" />24/7 AI Voice Companion</li>
                  <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-green-500" />Mood & Activity Tracking</li>
                  <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-green-500" />Anonymous Peer Support Chat</li>
                  <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-green-500" />Access to Volunteer Therapists</li>
                </ul>
                <Button size="lg" asChild className="w-full">
                  <Link href="/login">Get Started</Link>
                </Button>
              </div>

              {/* B2B Plan */}
              <div className="border rounded-xl p-8 flex flex-col">
                <h3 className="text-2xl font-headline font-bold">For Businesses</h3>
                <p className="text-muted-foreground mb-6">Support your team's mental health.</p>
                <div className="text-4xl font-bold mb-6">
                  Custom <span className="text-lg font-normal text-muted-foreground">/ per employee</span>
                </div>
                <ul className="space-y-4 text-muted-foreground mb-8 flex-1">
                  <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-primary" />All features from the Individual plan, plus:</li>
                  <li className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-primary" />Access to Licensed Health Professionals</li>
                  <li className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-primary" />Advanced Team Wellness Analytics</li>
                  <li className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-primary" />Custom Onboarding & Support</li>
                </ul>
                <Button size="lg" variant="outline" asChild className="w-full">
                  <Link href="mailto:victorehebhoria@gmail.com?subject=MindBud%20for%20Business%20Inquiry">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t">
        <div className="container mx-auto py-6 text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} MindBud. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-card p-6 rounded-xl shadow-md text-center">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-headline font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

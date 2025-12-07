
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const applicationSchema = z.object({
  role: z.enum(["professional", "student"], {
    required_error: "You must select a role.",
  }),
  fullName: z.string().min(3, "Full name is required."),
  email: z.string().email("Please enter a valid email address."),
  licenseNumber: z.string().optional(),
  university: z.string().optional(),
  programOfStudy: z.string().optional(),
  specializations: z.string().min(10, "Please list your specializations or areas of interest."),
  yearsExperience: z.coerce.number().min(0, "Years of experience cannot be negative."),
  hoursPerWeek: z.string().min(1, "Please select your available hours."),
  reasonToJoin: z.string().min(20, "Please provide a brief reason for joining."),
}).refine(data => {
    if (data.role === 'professional') return !!data.licenseNumber;
    return true;
}, {
    message: "License number is required for professionals.",
    path: ["licenseNumber"],
}).refine(data => {
    if (data.role === 'student') return !!data.university;
    return true;
}, {
    message: "University is required for students.",
    path: ["university"],
}).refine(data => {
    if (data.role === 'student') return !!data.programOfStudy;
    return true;
}, {
    message: "Program of study is required for students.",
    path: ["programOfStudy"],
});

export default function BuddyApplicationForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      email: user?.email || "",
      specializations: "",
      yearsExperience: 0,
      hoursPerWeek: "",
      reasonToJoin: "",
    },
  });

  const { isSubmitting, watch } = form.formState;
  const role = watch("role");

  const handleSubmit = async (values: z.infer<typeof applicationSchema>) => {
    if (!user) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to apply.",
            variant: "destructive",
        });
        return;
    }

    try {
      const applicationsCollectionRef = collection(firestore, "buddyApplications");
      await addDocumentNonBlocking(applicationsCollectionRef, {
        ...values,
        userId: user.uid,
        status: "pending", // Initial status
        submittedAt: new Date(),
      });

      toast({
        title: "Application Submitted",
        description: "Thank you for your interest! We will review your application and be in touch.",
      });
      form.reset();
      setSelectedRole(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>What is your current status?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="professional" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Licensed Professional
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="student" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Student / Trainee
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {role && (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                
                {role === 'professional' && (
                    <FormField control={form.control} name="licenseNumber" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Professional License Number</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g., LCSW12345, PSYD54321" /></FormControl>
                            <FormDescription>Please include your state and license type.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                )}

                {role === 'student' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="university" render={({ field }) => (
                            <FormItem>
                                <FormLabel>University / College</FormLabel>
                                <FormControl><Input {...field} placeholder="e.g., University of Wellness" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="programOfStudy" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Program of Study</FormLabel>
                                <FormControl><Input {...field} placeholder="e.g., Clinical Psychology, MSW" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                )}
                
                <FormField control={form.control} name="specializations" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Areas of Specialization or Interest</FormLabel>
                        <FormControl><Textarea {...field} placeholder="e.g., CBT, Trauma, Anxiety, etc."/></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormDescription>{role === 'student' ? 'Clinical or volunteer experience.' : 'Professional experience.'}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="hoursPerWeek" render={({ field }) => (
                        <FormItem>
                            <FormLabel>How many hours can you commit per week?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a range" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="1-3">1-3 hours</SelectItem>
                                    <SelectItem value="3-5">3-5 hours</SelectItem>
                                    <SelectItem value="5-10">5-10 hours</SelectItem>
                                    <SelectItem value="10+">10+ hours</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="reasonToJoin" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Why would you like to be a Mind Buddy?</FormLabel>
                        <FormControl><Textarea {...field} rows={5} placeholder="Tell us about your passion for mental health and why you'd like to volunteer."/></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting} size="lg">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                    </Button>
                </div>
            </>
        )}
      </form>
    </Form>
  );
}

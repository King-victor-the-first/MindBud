
'use server';
/**
 * @fileOverview Generates a personalized daily insight for the user based on their recent mood data.
 *
 * - generateDailyInsight - A function that returns a personalized insight.
 * - GenerateDailyInsightInput - The input type for the function.
 * - GenerateDailyInsightOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MoodObjectSchema = z.object({
  mood: z.string().describe("The user's reported mood (e.g., 'Good', 'Awful')."),
  date: z.string().describe("The ISO 8601 date string of when the mood was logged."),
});

const GenerateDailyInsightInputSchema = z.object({
  userName: z.string().describe("The user's first name."),
  recentMoods: z.array(MoodObjectSchema).describe("A list of the user's 5 most recent mood entries."),
});

export type GenerateDailyInsightInput = z.infer<typeof GenerateDailyInsightInputSchema>;

const GenerateDailyInsightOutputSchema = z.object({
  insight: z.string().describe('A short, encouraging, and personalized insight for the user.'),
});

export type GenerateDailyInsightOutput = z.infer<typeof GenerateDailyInsightOutputSchema>;

export async function generateDailyInsight(input: GenerateDailyInsightInput): Promise<GenerateDailyInsightOutput> {
  return generateDailyInsightFlow(input);
}

const insightPrompt = ai.definePrompt({
  name: 'generateDailyInsightPrompt',
  input: { schema: GenerateDailyInsightInputSchema },
  output: { schema: GenerateDailyInsightOutputSchema },
  prompt: `You are an AI assistant that generates a single, short, personalized, and encouraging "proactive insight" for a user named {{{userName}}}.
  The tone should be warm, supportive, and forward-looking. Do not sound clinical or demanding. It should be a single sentence.

  Analyze the user's recent mood entries to inform the insight.
  - If moods are generally positive, acknowledge their good progress.
  - If moods are mixed or trending down, offer gentle encouragement.
  - If there are no moods, provide a welcoming and general encouraging message.

  Recent Moods:
  {{#if recentMoods.length}}
    {{#each recentMoods}}
    - {{this.mood}} on {{this.date}}
    {{/each}}
  {{else}}
    No mood entries yet.
  {{/if}}
  
  Example Insights:
  - (For good moods): "It's wonderful to see you're feeling good lately, {{{userName}}}. Let's keep that positive energy flowing today!"
  - (For mixed moods): "Every day is a new opportunity, {{{userName}}}. Remember to be kind to yourself as you navigate your feelings."
  - (For bad moods): "It looks like things have been tough recently, {{{userName}}}. Remember that asking for help is a sign of strength."
  - (For no moods): "Welcome, {{{userName}}}! Taking a moment to check in with yourself is a great first step on your wellness journey."

  Generate one new insight for {{{userName}}}.
  `,
});

const generateDailyInsightFlow = ai.defineFlow(
  {
    name: 'generateDailyInsightFlow',
    inputSchema: GenerateDailyInsightInputSchema,
    outputSchema: GenerateDailyInsightOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await insightPrompt(input);
      return output!;
    } catch (error) {
      console.error("Error generating daily insight, returning fallback.", error);
      // Return a generic, safe fallback insight if the AI model fails.
      return {
        insight: `Every day is a new opportunity, ${input.userName}. Remember to be kind to yourself as you navigate your feelings.`,
      };
    }
  }
);


'use server';
/**
 * @fileOverview Summarizes a user's gratitude journal entries to provide positive reinforcement and identify themes.
 *
 * - summarizeGratitudeJournals - Analyzes journal entries and returns a summary.
 * - SummarizeGratitudeJournalsInput - The input type for the function.
 * - SummarizeGratitudeJournalsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const JournalEntrySchema = z.object({
  date: z.string().describe("The date of the entry in YYYY-MM-DD format."),
  entry: z.string().describe("The text content of the gratitude entry."),
});

const SummarizeGratitudeJournalsInputSchema = z.object({
  entries: z.array(JournalEntrySchema).describe('A list of gratitude journal entries.'),
});

export type SummarizeGratitudeJournalsInput = z.infer<typeof SummarizeGratitudeJournalsInputSchema>;

const SummarizeGratitudeJournalsOutputSchema = z.object({
  summary: z.string().describe('An encouraging summary identifying recurring themes of gratitude.'),
});

export type SummarizeGratitudeJournalsOutput = z.infer<typeof SummarizeGratitudeJournalsOutputSchema>;

export async function summarizeGratitudeJournals(input: SummarizeGratitudeJournalsInput): Promise<SummarizeGratitudeJournalsOutput> {
  return summarizeGratitudeJournalsFlow(input);
}

const summarizeGratitudePrompt = ai.definePrompt({
  name: 'summarizeGratitudePrompt',
  input: {schema: SummarizeGratitudeJournalsInputSchema},
  output: {schema: SummarizeGratitudeJournalsOutputSchema},
  prompt: `You are an AI assistant skilled at finding positive themes in text. Analyze the following gratitude journal entries and provide a short, encouraging summary (2-3 sentences). 

  Your summary should:
  - Be warm, gentle, and positive in tone.
  - Identify one or two recurring themes or categories of gratitude (e.g., "It seems like spending time with friends and appreciating nature are frequently bringing you joy.").
  - Avoid making direct suggestions. Simply reflect the positive patterns you see.
  - Do not list the specific entries, just summarize the themes.

  Journal Entries:
  {{#each entries}}
  - {{this.date}}: {{{this.entry}}}
  {{/each}}
  `,
});

const summarizeGratitudeJournalsFlow = ai.defineFlow(
  {
    name: 'summarizeGratitudeJournalsFlow',
    inputSchema: SummarizeGratitudeJournalsInputSchema,
    outputSchema: SummarizeGratitudeJournalsOutputSchema,
  },
  async input => {
    // If there are very few entries, return a simple, encouraging message without calling the LLM.
    if (input.entries.length < 3) {
      return {
        summary: "It's wonderful that you're taking the time to note the good things in your life. Keep it up to see more patterns emerge!",
      };
    }
    const {output} = await summarizeGratitudePrompt(input);
    return output!;
  }
);


'use server';
/**
 * @fileOverview Summarizes a list of user-provided notes into a concise theme.
 *
 * - summarizeTriggerNotes - Analyzes text notes and returns a short summary.
 * - SummarizeTriggerNotesInput - The input type for the function.
 * - SummarizeTriggerNotesOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';

const SummarizeTriggerNotesInputSchema = z.object({
  notes: z.array(z.string()).describe('A list of short text notes from a user, explaining their mood.'),
});

export type SummarizeTriggerNotesInput = z.infer<typeof SummarizeTriggerNotesInputSchema>;

const SummarizeTriggerNotesOutputSchema = z.object({
  summary: z.string().describe('A 1 to 3-word summary of the underlying theme of the notes.'),
});

export type SummarizeTriggerNotesOutput = z.infer<typeof SummarizeTriggerNotesOutputSchema>;

export async function summarizeTriggerNotes(input: SummarizeTriggerNotesInput): Promise<SummarizeTriggerNotesOutput> {
  return summarizeTriggerNotesFlow(input);
}

const summarizeNotesPrompt = ai.definePrompt({
  name: 'summarizeTriggerNotesPrompt',
  input: { schema: SummarizeTriggerNotesInputSchema },
  output: { schema: SummarizeTriggerNotesOutputSchema },
  prompt: `You are an expert at finding themes in user-provided text. Analyze the following short notes, which were provided by a user to explain their mood. 
  
  Your task is to generate a concise summary of the recurring theme in 1 to 3 words. This summary will be used as a label.
  
  For example:
  - If notes are "Woke up late", "Felt groggy this morning", the summary should be "Sleep Quality" or "Morning Routine".
  - If notes are "Finals are next week", "Stressed about my paper", the summary should be "Academic Pressure".
  - If notes are "My train was delayed", "Stuck in traffic", the summary should be "Commute Issues".

  Notes to analyze:
  {{#each notes}}
  - {{{this}}}
  {{/each}}
  
  Generate the 1-3 word summary.
  `,
});

const summarizeTriggerNotesFlow = ai.defineFlow(
  {
    name: 'summarizeTriggerNotesFlow',
    inputSchema: SummarizeTriggerNotesInputSchema,
    outputSchema: SummarizeTriggerNotesOutputSchema,
  },
  async (input) => {
    if (input.notes.length === 0) {
      return { summary: "Personal Matters" };
    }
    const { output } = await summarizeNotesPrompt(input);
    return output!;
  }
);

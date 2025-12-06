
'use server';

/**
 * @fileOverview An AI moderation flow for the anonymous peer-to-peer group chat.
 *
 * - moderateGroupChatMessage - A function that moderates a single chat message.
 * - ModerateGroupChatMessageInput - The input type for the moderateGroupChatMessage function.
 * - ModerateGroupChatMessageOutput - The return type for the moderateGroupChatMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ModerateGroupChatMessageInputSchema = z.object({
  message: z.string().describe('The chat message to moderate.'),
  userId: z.string().describe('The ID of the user sending the message.'),
});
export type ModerateGroupChatMessageInput = z.infer<typeof ModerateGroupChatMessageInputSchema>;

const ModerateGroupChatMessageOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the message is safe and appropriate.'),
  reason: z.string().optional().describe('The reason the message was flagged as unsafe.'),
});
export type ModerateGroupChatMessageOutput = z.infer<typeof ModerateGroupChatMessageOutputSchema>;

export async function moderateGroupChatMessage(
  input: ModerateGroupChatMessageInput
): Promise<ModerateGroupChatMessageOutput> {
  return moderateGroupChatFlow(input);
}

const moderationPrompt = ai.definePrompt({
  name: 'moderationPrompt',
  input: {schema: ModerateGroupChatMessageInputSchema},
  output: {schema: ModerateGroupChatMessageOutputSchema},
  prompt: `You are an AI moderator for an anonymous peer-to-peer group chat designed to provide a supportive environment.

  Your role is to ensure the safety and well-being of all users by identifying and flagging inappropriate or harmful content.

  Analyze the following chat message and determine if it violates the guidelines below. Respond with a JSON object that contains an isSafe boolean (true if the message is safe, false if it is not) and, if the message is not safe, a reason string explaining why.

  Guidelines:
  - No hate speech, harassment, or discrimination.
  - No threats of violence or promotion of harmful activities.
  - No sharing of personal identifying information (PII) such as real full names, email addresses, phone numbers, or physical addresses. Do not flag random strings or character sequences that are not clearly PII.
  - No attempts to identify other users.
  - No sexually explicit content or exploitation, abuse, or endangerment of children.
  - No spam or phishing attempts.
  - No illegal activities.

  Message: {{{message}}}
  User ID: {{{userId}}}`,
});

const moderateGroupChatFlow = ai.defineFlow(
  {
    name: 'moderateGroupChatFlow',
    inputSchema: ModerateGroupChatMessageInputSchema,
    outputSchema: ModerateGroupChatMessageOutputSchema,
  },
  async input => {
    const {output} = await moderationPrompt(input);
    return output!;
  }
);

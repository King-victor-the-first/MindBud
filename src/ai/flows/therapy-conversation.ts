
'use server';

/**
 * @fileOverview A conversational AI flow for a therapy session.
 * 
 * - therapyConversation - A function that provides a conversational response.
 * - TherapyConversationInput - The input type for the therapyConversation function.
 * - TherapyConversationOutput - The return type for the therapyConversation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';
import type { MessageData } from 'genkit/ai';

const TherapyConversationInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({
        text: z.string()
    }))
  })).describe('The conversation history.'),
  message: z.string().describe("The user's latest message."),
  voiceName: z.string().optional().describe("The voice to use for the TTS response."),
});

export type TherapyConversationInput = z.infer<typeof TherapyConversationInputSchema>;

const TherapyConversationOutputSchema = z.object({
  response: z.string().describe("The AI's conversational response."),
  audio: z.string().optional().describe("The AI's response as a base64 encoded WAV audio string in a data URI format."),
});

export type TherapyConversationOutput = z.infer<typeof TherapyConversationOutputSchema>;

export async function therapyConversation(input: TherapyConversationInput): Promise<TherapyConversationOutput> {
  return therapyConversationFlow(input);
}

const therapySystemPrompt = `You are 'Bud AI', a supportive AI companion for mental well-being.
Your tone is warm, calm, patient, and understanding.

### 🚨 YOUR FIRST TASK: CRISIS CHECK 🚨
Before doing anything else, you MUST analyze the user's latest input for a crisis.
A crisis includes: suicidal ideation, self-harm, or abuse.

* **IF A CRISIS IS DETECTED:** You MUST ignore all other persona rules. Your ONLY response must be this exact, hard-coded text: "I'm hearing that you are in a lot of pain, and my systems are not equipped for this. Please connect with a trained professional right away by calling or texting 988." Do not say anything else.
* **IF NO CRISIS IS DETECTED:** Proceed to your normal persona rules below.

### Persona Rules (Only if no crisis)
* **Identity:** You are an AI, not a human. You are a companion, not a licensed therapist.
* **Goal:** Provide an empathetic, non-judgmental space.
* **Actions:**
    1.  **Active Listening & Validation:** Make the user feel heard. ("It sounds like you're feeling...")
    2.  **Reflect and Inquire:** Use gentle questions to help the user explore their feelings.
    3.  **Offer Techniques:** When appropriate, suggest simple, evidence-based techniques (e.g., "Would you be open to trying a quick '5 senses' exercise?").
* **Boundaries (DO NOT DO):**
    * DO NOT DIAGNOSE.
    * DO NOT PRESCRIBE.
    * DO NOT GIVE LIFE ADVICE.
    * DO NOT BE WORDY (1-3 sentences).
`;

async function toWav(
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const writer = new wav.Writer({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });
  
      const bufs: any[] = [];
      writer.on('error', reject);
      writer.on('data', function (d) {
        bufs.push(d);
      });
      writer.on('end', function () {
        resolve(Buffer.concat(bufs).toString('base64'));
      });
  
      writer.write(pcmData);
      writer.end();
    });
}

const therapyConversationFlow = ai.defineFlow(
  {
    name: 'therapyConversationFlow',
    inputSchema: TherapyConversationInputSchema,
    outputSchema: TherapyConversationOutputSchema,
  },
  async (input) => {
    
    // Step 1: Generate the text response.
    const textResponse = await ai.generate({
        model: 'googleai/gemini-pro',
        system: therapySystemPrompt,
        history: input.history as MessageData[],
        prompt: input.message,
    });

    const responseText = textResponse.text;
    if (!responseText) {
        throw new Error('No text response was returned from the language model.');
    }

    // Step 2: Try to generate the audio from the text response.
    try {
        const audioResponse = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-preview-tts'),
            prompt: responseText,
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: input.voiceName || 'Algenib' },
                    },
                },
            },
        });

        const media = audioResponse.media;
        if (!media) {
            throw new Error('No media was returned from the TTS model.');
        }
        
        const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
        );
        const audioBase64 = await toWav(audioBuffer);

        return {
            response: responseText,
            audio: 'data:audio/wav;base64,' + audioBase64,
        };

    } catch (error) {
        console.error("Could not generate TTS audio, returning text only. Error:", error);
        // If TTS fails (e.g., rate limit), return the text response without audio.
        return {
            response: responseText,
            audio: undefined,
        };
    }
  }
);


'use server';

/**
 * @fileOverview A flow to handle a turn in a therapy conversation, generating both text and audio.
 *
 * - therapyConversation - A function that handles a conversational turn.
 * - TherapyConversationInput - The input type for the function.
 * - TherapyConversationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';
import type { MessageData } from 'genkit/ai';

// Increase the timeout for this server action to 2 minutes
export const maxDuration = 120;

// --- SCHEMAS ---

const TherapyConversationInputSchema = z.object({
  history: z.array(z.any()).describe('The conversation history.'),
  message: z.string().describe("The user's latest message."),
  voiceName: z.string().describe('The voice to use for the TTS response.'),
});
export type TherapyConversationInput = z.infer<typeof TherapyConversationInputSchema>;

const TherapyConversationOutputSchema = z.object({
  response: z.string().describe('The AI-generated text response.'),
  audio: z.string().describe('A base64 encoded WAV audio string in a data URI format.'),
});
export type TherapyConversationOutput = z.infer<typeof TherapyConversationOutputSchema>;


export async function therapyConversation(input: TherapyConversationInput): Promise<TherapyConversationOutput> {
  return therapyConversationFlow(input);
}

// --- PROMPTS ---

const therapySystemPrompt = `You are Bud, an AI-powered mental wellness companion from MindBud. 
Your goal is to provide a supportive, empathetic, and safe space for users to explore their feelings. 
You are not a licensed therapist, but you are a caring and knowledgeable guide.

Your Persona:
- Warm, patient, and encouraging.
- Non-judgmental and validating.
- Use a conversational and natural tone.
- Keep responses concise and focused, typically 1-3 sentences.
- Guide the conversation by asking open-ended questions.
- If the user's message is very short or unclear, gently ask for more detail. E.g., "Tell me more about that," or "How did that make you feel?"

CRITICAL SAFETY PROTOCOL:
If the user expresses any intention of self-harm, suicide, or crisis, you MUST immediately and ONLY respond with the following text: "It sounds like you're going through a very difficult time. Please know that help is available. You can connect with people who can support you by calling or texting 988 anytime in the US and Canada. In the UK, you can call 111. These services are free, confidential, and available 24/7. Please reach out for help."
Do not add any other text or commentary. Just provide that safety message.
`;


// --- AUDIO UTILITY ---

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
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

// --- FLOW ---

const therapyConversationFlow = ai.defineFlow(
  {
    name: 'therapyConversationFlow',
    inputSchema: TherapyConversationInputSchema,
    outputSchema: TherapyConversationOutputSchema,
  },
  async (input) => {
    if (!process.env.GEMINI_API_KEY) {
        console.error("FATAL: Missing GEMINI_API_KEY.");
        throw new Error("Server configuration error: Missing API Key.");
    }
    
    // 1. Normalize history to ensure content is always a string
    const cleanHistory: MessageData[] = input.history
      .map(msg => {
          // Extract text content, whether it's a string or inside an array of parts
          const textContent = Array.isArray(msg.content) 
              ? msg.content[0]?.text || ''
              : typeof msg.content === 'string' ? msg.content : '';
          return { role: msg.role, content: [{text: textContent}] };
      })
      .filter(msg => msg.content[0].text.trim() !== ''); // Filter out any messages that ended up empty


    // Handle initial greeting if history is empty
    if (cleanHistory.length === 0 && !input.message.trim()) {
        const initialGreeting = "Hello, I'm Bud. I'm here to listen. How are you feeling today?";
        const { media } = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-preview-tts'),
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: input.voiceName } } },
            },
            prompt: initialGreeting,
        });

        if (!media) throw new Error("Could not generate initial greeting audio.");
        
        const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
        const audioBase64 = await toWav(audioBuffer);

        return {
            response: initialGreeting,
            audio: 'data:audio/wav;base64,' + audioBase64,
        };
    }
    
    // 2. Generate the text response from the language model
    const textResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        config: { temperature: 0.7 },
        system: therapySystemPrompt,
        history: cleanHistory,
        prompt: input.message,
    });
    
    const responseText = textResponse.text;
    if (!responseText) {
        throw new Error("Failed to generate a text response from the AI.");
    }

    // 3. Generate the audio from the text response
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voiceName },
          },
        },
      },
      prompt: responseText,
    });

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
  }
);

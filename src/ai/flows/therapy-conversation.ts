
'use server';

/**
 * @fileOverview A conversational AI flow for a therapy session.
 * Debugging Version: Fixes the 'history' property error by using 'messages'.
 */

// 1. Imports
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

// --- SCHEMAS ---

const TherapyConversationInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.any() // Use z.any() for flexibility
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

// --- EXPORTED FUNCTION ---

export async function therapyConversation(input: TherapyConversationInput): Promise<TherapyConversationOutput> {
  return therapyConversationFlow(input);
}

// --- PROMPTS ---

const therapySystemPrompt = `You are 'Bud AI', a supportive AI companion for mental well-being.
Your tone is warm, calm, patient, and understanding.

Your first response should always be: "Hello, I'm Bud. I'm here to listen. How are you feeling today?"

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

// --- HELPER FUNCTIONS ---

async function toWav(
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // DEBUG LOG
      console.log(`🔊 toWav called: Buffer size ${pcmData.length}, Rate ${rate}`);
      
      const writer = new wav.Writer({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });
  
      const bufs: any[] = [];
      writer.on('error', (err) => {
        console.error("❌ WAV Writer Error:", err);
        reject(err);
      });
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

// --- MAIN FLOW ---

const therapyConversationFlow = ai.defineFlow(
  {
    name: 'therapyConversationFlow',
    inputSchema: TherapyConversationInputSchema,
    outputSchema: TherapyConversationOutputSchema,
  },
  async (input) => {
    console.log("🚀 START: Therapy Flow Triggered");
    console.log(`📝 User Message: "${input.message}"`);
    console.log(`📂 History Length: ${input.history?.length || 0}`);

    try {
        // Step 1: Generate the text response.
        console.log("⏳ Step 1: Generating Text with gemini-pro...");
        
        // Normalize the history to ensure content is always a string.
        const normalizedHistory = input.history.map(msg => {
          const textContent = Array.isArray(msg.content) 
            ? msg.content.map(p => p.text).join('') 
            : msg.content;
          return { role: msg.role, content: textContent };
        });

        const allMessages = [...normalizedHistory, { role: 'user' as const, content: input.message }];

        const conversationMessages = allMessages
            .filter(h => h.content && h.content.trim() !== '')
            .map((h) => ({
                role: h.role,
                content: [{ text: h.content }]
            }));
        
        // Handle the edge case where there are no valid messages to send.
        if (conversationMessages.length === 0 && input.message.trim() === '') {
            const initialGreeting = "Hello, I'm Bud. I'm here to listen. How are you feeling today?";
             const { media } = await ai.generate({
                model: googleAI.model('gemini-2.5-flash-preview-tts'),
                prompt: initialGreeting,
                 config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: input.voiceName || 'Algenib' },
                        },
                    },
                },
            });
             if (!media) { throw new Error('Initial greeting audio generation failed.'); }
            const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
            const audioBase64 = await toWav(audioBuffer);

            return {
                response: initialGreeting,
                audio: 'data:audio/wav;base64,' + audioBase64,
            };
        }
        
        const textResponse = await ai.generate({
            model: 'googleai/gemini-pro', 
            system: therapySystemPrompt,
            messages: conversationMessages as any,
        });

        const responseText = textResponse.text;
        console.log("✅ Step 1 Complete. Response Preview:", responseText.substring(0, 50) + "...");

        if (!responseText) {
            throw new Error('No text response was returned from the language model.');
        }

        // Step 2: Try to generate the audio from the text response.
        console.log("⏳ Step 2: Attempting Audio Generation (TTS)...");
        try {
            const ttsModelName = 'gemini-2.5-flash-preview-tts'; 
            console.log(`🔧 Using Model for TTS: ${ttsModelName}`);

            const { media } = await ai.generate({
                model: googleAI.model(ttsModelName),
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

            if (!media) {
                console.warn("⚠️ AI returned no media object.");
                throw new Error('No media was returned from the TTS model.');
            }
            
            console.log("🔍 Media Object Received:", {
                contentType: media.contentType,
                urlStart: media.url.substring(0, 30) 
            });

            const audioBuffer = Buffer.from(
                media.url.substring(media.url.indexOf(',') + 1),
                'base64'
            );
            
            console.log("⏳ Converting Buffer to WAV format...");
            const audioBase64 = await toWav(audioBuffer);
            console.log("✅ WAV Conversion Successful.");

            return {
                response: responseText,
                audio: 'data:audio/wav;base64,' + audioBase64,
            };

        } catch (audioError) {
            console.error("❌ Audio Generation Failed (Continuing with text only):", audioError);
            return {
                response: responseText,
                audio: undefined, 
            };
        }
    } catch (e) {
        console.error("❌ CRITICAL FLOW ERROR:", e);
        throw e; 
    }
  }
);

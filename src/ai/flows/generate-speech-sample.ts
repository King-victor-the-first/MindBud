
'use server';

/**
 * @fileOverview A flow to generate a short audio sample for a given voice.
 *
 * - generateSpeechSample - Generates a TTS audio clip.
 * - GenerateSpeechSampleInput - The input type for the function.
 * - GenerateSpeechSampleOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateSpeechSampleInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  voiceName: z.string().describe('The name of the voice to use (e.g., Algenib, Achernar).'),
});
export type GenerateSpeechSampleInput = z.infer<typeof GenerateSpeechSampleInputSchema>;

const GenerateSpeechSampleOutputSchema = z.object({
  audio: z.string().describe('A base64 encoded WAV audio string in a data URI format.'),
});
export type GenerateSpeechSampleOutput = z.infer<typeof GenerateSpeechSampleOutputSchema>;

export async function generateSpeechSample(input: GenerateSpeechSampleInput): Promise<GenerateSpeechSampleOutput> {
  return generateSpeechSampleFlow(input);
}

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

const generateSpeechSampleFlow = ai.defineFlow(
  {
    name: 'generateSpeechSampleFlow',
    inputSchema: GenerateSpeechSampleInputSchema,
    outputSchema: GenerateSpeechSampleOutputSchema,
  },
  async (input) => {
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
      prompt: input.text,
    });

    if (!media?.url) {
      throw new Error('No media was returned from the TTS model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const audioBase64 = await toWav(audioBuffer);

    return {
      audio: 'data:audio/wav;base64,' + audioBase64,
    };
  }
);

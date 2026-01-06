'use server';

/**
 * @fileOverview Content Discovery Assistant AI agent.
 *
 * - contentDiscoveryAssistant - A function that provides content recommendations.
 * - ContentDiscoveryAssistantInput - The input type for the contentDiscoveryAssistant function.
 * - ContentDiscoveryAssistantOutput - The return type for the contentDiscovery-assistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContentDiscoveryAssistantInputSchema = z.object({}).describe("No input needed for daily dorama update.");
export type ContentDiscoveryAssistantInput = z.infer<typeof ContentDiscoveryAssistantInputSchema>;

const ContentDiscoveryAssistantOutputSchema = z.object({
  recommendations: z
    .string()
    .describe(
      'A list of currently airing K-dramas (doramas).'
    ),
});
export type ContentDiscoveryAssistantOutput = z.infer<typeof ContentDiscoveryAssistantOutputSchema>;

export async function contentDiscoveryAssistant(
  input?: ContentDiscoveryAssistantInput
): Promise<ContentDiscoveryAssistantOutput> {
  return contentDiscoveryAssistantFlow(input || {});
}

const prompt = ai.definePrompt({
  name: 'contentDiscoveryAssistantPrompt',
  input: {schema: ContentDiscoveryAssistantInputSchema},
  output: {schema: ContentDiscoveryAssistantOutputSchema},
  prompt: `You are a content recommendation expert. Your task is to research and provide a list of popular K-dramas (doramas) that are currently airing.

  List the shows that are currently broadcasting new episodes.`,
});

const contentDiscoveryAssistantFlow = ai.defineFlow(
  {
    name: 'contentDiscoveryAssistantFlow',
    inputSchema: ContentDiscoveryAssistantInputSchema,
    outputSchema: ContentDiscoveryAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

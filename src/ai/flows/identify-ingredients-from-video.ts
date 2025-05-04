
'use server';
/**
 * @fileOverview Identifies ingredients from a video using AI.
 *
 * - identifyIngredientsFromVideo - A function that processes a video data URI to identify ingredients.
 * - IdentifyIngredientsInput - The input type for the function.
 * - IdentifyIngredientsOutput - The return type for the function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Define the input schema: a video data URI
const IdentifyIngredientsInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of a fridge interior, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyIngredientsInput = z.infer<typeof IdentifyIngredientsInputSchema>;

// Define the output schema: a comma-separated string of identified ingredients
const IdentifyIngredientsOutputSchema = z.object({
  identifiedIngredients: z
    .string()
    .describe('A comma-separated list of ingredients identified in the video.')
    .optional(), // Make optional in case nothing is identified
});
export type IdentifyIngredientsOutput = z.infer<typeof IdentifyIngredientsOutputSchema>;

// Exported function to call the flow
export async function identifyIngredientsFromVideo(input: IdentifyIngredientsInput): Promise<IdentifyIngredientsOutput> {
  return identifyIngredientsFlow(input);
}

// Define the Genkit prompt
const identifyIngredientsPrompt = ai.definePrompt({
  name: 'identifyIngredientsPrompt',
  input: {
    schema: IdentifyIngredientsInputSchema,
  },
  output: {
    schema: IdentifyIngredientsOutputSchema,
  },
  prompt: `You are an expert food identification assistant. Analyze the provided video frames showing the inside of a refrigerator.
Identify all visible food ingredients.
List the identified ingredients as a comma-separated string.
Focus only on distinct food items (e.g., 'milk', 'eggs', 'broccoli', 'chicken breast', 'cheddar cheese', 'apples').
Do not include containers unless they clearly indicate the food type (e.g., 'yogurt tub' is fine if yogurt is identifiable, but 'plastic container' is not).
If no ingredients are clearly identifiable, return an empty string for the identifiedIngredients field.

Video: {{media url=videoDataUri}}

Identified Ingredients (comma-separated):
`,
  // Specify the model capable of video input (Gemini 1.5 Pro or Flash)
  // Using Flash for potentially faster and cheaper processing, but Pro might be more accurate.
  model: 'googleai/gemini-1.5-flash',
  config: {
    // Adjust temperature for more deterministic output if needed
    temperature: 0.2,
  }
});

// Define the Genkit flow
const identifyIngredientsFlow = ai.defineFlow<
  typeof IdentifyIngredientsInputSchema,
  typeof IdentifyIngredientsOutputSchema
>(
  {
    name: 'identifyIngredientsFlow',
    inputSchema: IdentifyIngredientsInputSchema,
    outputSchema: IdentifyIngredientsOutputSchema,
  },
  async (input) => {
    // Call the prompt with the video data URI
    const { output } = await identifyIngredientsPrompt(input);

    // Return the identified ingredients or an empty object if output is null/undefined
    return output ?? { identifiedIngredients: '' };
  }
);

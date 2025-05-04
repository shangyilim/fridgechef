import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      // Ensure the API key is read from the environment variable
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // You might want to default to a specific model, but ensure the API key is set.
  model: 'googleai/gemini-2.0-flash', // Example: defaulting to a specific model
});

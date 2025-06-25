import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let genkitInitObj = {};

if (process.env.GEMINI_API_KEY) {
  genkitInitObj = {
    apiKey: process.env.GEMINI_API_KEY
  };
}

export const ai = genkit({
  plugins: [googleAI(genkitInitObj)],
  model: 'googleai/gemini-2.0-flash',
});

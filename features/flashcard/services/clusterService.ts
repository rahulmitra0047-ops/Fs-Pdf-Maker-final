import { aiManager } from '../../../core/ai/aiManager';
import { WordCluster, ClusterNode } from '../../../types';

export const clusterService = {
  generateCluster: async (basicWord: string): Promise<WordCluster> => {
    const prompt = `
You are an expert English vocabulary teacher.
The user wants to learn a "Word Universe" for the basic word: "${basicWord}".

You MUST return the response ONLY as a valid JSON object. Do not include markdown formatting like \`\`\`json.

Requirements:
1. "id": Generate a unique random string.
2. "basicWord": The word provided: "${basicWord}".
3. "baseContext": A simple base sentence using the basic word.
4. "createdAt": Current timestamp in milliseconds.
5. For the following categories, generate the exact number of items. For EVERY item, provide:
   - "id": A unique random string (e.g., "adv_1").
   - "word": The vocabulary word/phrase.
   - "meaning": Bengali meaning.
   - "partOfSpeech": Noun, Verb, Adjective, Adverb, or Phrase.
   - "exampleSentence": A sentence that uses this specific word, but keeps the exact same context/scenario as the "baseContext".

Categories:
- "advancedWords": Exactly 2 advanced synonyms.
- "greWords": Exactly 3 high-frequency GRE synonyms.
- "idioms": Exactly 2 idioms or phrases related to the word.
- "oneWordSubstitutes": Exactly 2 one-word substitutes related to the concept.

Example JSON format:
{
  "id": "cluster_123",
  "basicWord": "Sad",
  "baseContext": "When he lost his wallet, he was very sad.",
  "createdAt": 1712345678900,
  "advancedWords": [
    { "id": "adv_1", "word": "Gloomy", "meaning": "বিষণ্ণ", "partOfSpeech": "Adjective", "exampleSentence": "When he lost his wallet, he felt absolutely gloomy." }
  ],
  "greWords": [
    { "id": "gre_1", "word": "Melancholy", "meaning": "গভীর বিষাদ", "partOfSpeech": "Noun", "exampleSentence": "The loss of his wallet left him in a state of deep melancholy." }
  ],
  "idioms": [
    { "id": "idm_1", "word": "Down in the dumps", "meaning": "মন খারাপ", "partOfSpeech": "Phrase", "exampleSentence": "Ever since he lost his wallet, he's been down in the dumps." }
  ],
  "oneWordSubstitutes": [
    { "id": "ows_1", "word": "Pessimist", "meaning": "হতাশাবাদী", "partOfSpeech": "Noun", "exampleSentence": "Losing the wallet made him act like a pessimist about everything." }
  ]
}

Generate the JSON for the word: "${basicWord}". Ensure the JSON is perfectly formatted.
`;

    const response = await aiManager.generateContent('gemini-2.5-flash', prompt);
    
    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.text) {
      throw new Error("Failed to generate cluster.");
    }

    try {
      let jsonStr = response.text.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
      }
      const data = JSON.parse(jsonStr) as WordCluster;
      data.id = crypto.randomUUID();
      data.createdAt = Date.now();
      return data;
    } catch (e) {
      console.error("Failed to parse JSON:", response.text);
      throw new Error("AI returned invalid format.");
    }
  },

  regenerateNode: async (basicWord: string, baseContext: string, nodeType: string, oldWord: string): Promise<ClusterNode> => {
    const prompt = `
You are an expert English vocabulary teacher.
For the basic word "${basicWord}" and the base context "${baseContext}", you previously generated the ${nodeType} "${oldWord}".
The user wants a NEW, DIFFERENT ${nodeType} to replace it.

Return ONLY valid JSON matching this structure:
{
  "id": "new_unique_id",
  "word": "new word",
  "meaning": "Bengali meaning",
  "partOfSpeech": "Noun/Verb/Adjective/Phrase",
  "exampleSentence": "Adapted sentence using the new word in the same base context"
}

Do not include markdown formatting like \`\`\`json.
`;

    const response = await aiManager.generateContent('gemini-2.5-flash', prompt);
    
    if (response.error) {
      throw new Error(response.error);
    }

    try {
      let jsonStr = response.text!.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
      }
      const data = JSON.parse(jsonStr) as ClusterNode;
      data.id = crypto.randomUUID();
      return data;
    } catch (e) {
      console.error("Failed to parse JSON:", response.text);
      throw new Error("AI returned invalid format.");
    }
  }
};

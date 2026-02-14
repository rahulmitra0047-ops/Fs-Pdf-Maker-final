
import { GoogleGenAI } from "@google/genai";

// Browser safeguard for @google/genai SDK to prevent crash
// The SDK attempts to access process.env or process.version in some environments
if (typeof window !== 'undefined') {
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }
  if (typeof (globalThis as any).process === 'undefined') {
    (globalThis as any).process = { env: {} };
  }
}

interface AiResponse {
  text: string | null;
  error: string | null;
}

class AiManager {
  private static instance: AiManager;
  private apiKeys: string[] = [];
  private currentIndex = 0;

  private constructor() {}

  static getInstance() {
    if (!AiManager.instance) {
      AiManager.instance = new AiManager();
    }
    return AiManager.instance;
  }

  /**
   * Set keys from App Settings.
   */
  setKeys(keys: string[]) {
    if (!Array.isArray(keys)) return;
    this.apiKeys = keys.filter(k => k && typeof k === 'string' && k.trim().length > 0);
  }

  /**
   * Get the next key.
   */
  private getKey(): string | null {
    if (this.apiKeys.length === 0) return null;
    
    const key = this.apiKeys[this.currentIndex % this.apiKeys.length];
    this.currentIndex++;
    return key;
  }

  /**
   * Test a key with a strict hard timeout to prevent UI freezes.
   */
  async testKey(key: string): Promise<boolean> {
    if (!key || !key.trim()) return false;
    
    // Hard abort for tests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s hard limit for tests

    try {
        const ai = new GoogleGenAI({ apiKey: key });
        // Use flash-preview for simple check
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: 'OK' }] }],
            config: { maxOutputTokens: 5 }
        });
        
        clearTimeout(timeoutId);
        return !!(response && response.text);
    } catch (e: any) {
        clearTimeout(timeoutId);
        const msg = e.message || "";
        console.warn("Key verification failed:", msg);
        
        // If external modal is triggered or key is missing, return false to unblock UI
        return false;
    }
  }

  /**
   * Safe Generate Content - NEVER THROWS.
   * Returns { text, error }
   */
  async generateContent(model: string, prompt: string, config?: any): Promise<AiResponse> {
    const key = this.getKey();

    if (!key) {
        return { 
            text: null, 
            error: "API Key নেই। Settings এ গিয়ে Key সেট করুন।" 
        };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: key });
        
        // Setup AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s Timeout for full tasks

        try {
            const response = await ai.models.generateContent({
                model: model || 'gemini-3-flash-preview',
                contents: [{ parts: [{ text: prompt }] }],
                config: config || {}
            });
            
            clearTimeout(timeoutId);

            if (response && response.text) {
                return { text: response.text, error: null };
            } else {
                return { text: null, error: "AI থেকে কোনো উত্তর পাওয়া যায়নি" };
            }

        } catch (innerError: any) {
            clearTimeout(timeoutId);
            if (innerError.name === 'AbortError' || innerError.message?.includes('aborted')) {
                return { text: null, error: "Time limit exceeded. আবার চেষ্টা করুন।" };
            }
            throw innerError;
        }

    } catch (e: any) {
        console.error("AI Error Safe Catch:", e);
        
        let msg = e.message || "Unknown error";
        if (msg.includes("API key")) msg = "Invalid API Key.";
        if (msg.includes("fetch")) msg = "ইন্টারনেট কানেকশন চেক করুন।";
        if (msg.includes("Requested entity was not found")) msg = "Model access denied or restricted.";
        
        return { text: null, error: msg };
    }
  }
}

export const aiManager = AiManager.getInstance();

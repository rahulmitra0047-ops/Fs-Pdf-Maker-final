
import { GoogleGenAI } from "@google/genai";

// Browser safeguard for @google/genai SDK to prevent crash
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
  private preferredModel: string = 'gemini-3-flash-preview';

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
   * Set preferred model globally.
   */
  setModel(model: string) {
    if (model && model.trim()) {
        this.preferredModel = model;
    }
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
    
    try {
        // Race condition to force timeout even if SDK hangs
        const result = await Promise.race([
            (async () => {
                const ai = new GoogleGenAI({ apiKey: key });
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: [{ parts: [{ text: 'OK' }] }],
                    config: { maxOutputTokens: 5 }
                });
                return !!(response && response.text);
            })(),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 6000)) // 6s Strict Timeout
        ]);
        
        return result;
    } catch (e: any) {
        console.warn("Key verification failed:", e.message);
        return false;
    }
  }

  /**
   * Safe Generate Content - NEVER THROWS.
   * Uses preferredModel unless specifically overridden.
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

    // Use Global Preference if set
    const finalModel = this.preferredModel || model || 'gemini-3-flash-preview';
    
    // Increased default timeout to 60s for complex tasks, allow override
    const timeoutDuration = config?.timeout || 60000;

    try {
        // Race against a timeout promise
        const result = await Promise.race([
            (async () => {
                const ai = new GoogleGenAI({ apiKey: key });
                const response = await ai.models.generateContent({
                    model: finalModel,
                    contents: [{ parts: [{ text: prompt }] }],
                    config: config || {}
                });
                
                if (response && response.text) {
                    return { text: response.text, error: null };
                } else {
                    return { text: null, error: "AI থেকে কোনো উত্তর পাওয়া যায়নি" };
                }
            })(),
            new Promise<AiResponse>((resolve) => {
                setTimeout(() => resolve({ text: null, error: "Time limit exceeded. Server is busy." }), timeoutDuration);
            })
        ]);

        return result;

    } catch (e: any) {
        console.error("AI Error Safe Catch:", e);
        
        let msg = e.message || "Unknown error";
        if (msg.includes("API key")) msg = "Invalid API Key.";
        if (msg.includes("fetch")) msg = "ইন্টারনেট কানেকশন চেক করুন।";
        if (msg.includes("Requested entity was not found")) msg = "Model access denied or restricted.";
        if (msg.includes("429")) msg = "Too many requests. Please wait.";
        
        return { text: null, error: msg };
    }
  }
}

export const aiManager = AiManager.getInstance();

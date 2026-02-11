
import { ArchitecturePrompt } from '../types';

interface ModelOptions {
  apiKey?: string;
  baseUrl?: string;
  modelId?: string;
  aspectRatio?: string;
  images?: string[];
  signal?: AbortSignal;
}

export class GeminiService {
  private sanitizeUrl(url?: string): string {
    if (!url) return 'https://generativelanguage.googleapis.com';
    return url.replace(/\/+$/, '').replace(/\/v1$/, '');
  }

  async optimizePrompt(text: string, imageBase64: string = "", options: ModelOptions): Promise<ArchitecturePrompt> {
    const { apiKey, baseUrl, modelId, signal } = options;
    const cleanBase = this.sanitizeUrl(baseUrl);
    const isProxy = !cleanBase.includes('googleapis.com');
    const endpoint = isProxy ? `${cleanBase}/v1/chat/completions` : `${cleanBase}/v1beta/models/${modelId || 'gemini-2.0-flash-exp'}:generateContent?key=${apiKey}`;

    const systemInstruction = `You are a Senior Architectural Design AI. Analyze layout/structure. Output JSON ONLY: { "chinese": "...", "english": "...", "metadata": { "material": "...", "perspective": "...", "lighting": "..." } }`;

    const body = isProxy ? {
      model: modelId || 'gemini-2.0-flash-exp',
      messages: [{ role: "user", content: [{ type: "text", text: `${systemInstruction}\n\nTask: ${text}` }, ...(imageBase64 ? [{ type: "image_url", image_url: { url: imageBase64 } }] : [])] }],
      response_format: { type: "json_object" }
    } : {
      contents: [{ parts: [{ text: `${systemInstruction}\n\nTask: ${text}` }, ...(imageBase64 ? [{ inline_data: { mime_type: imageBase64.split(';')[0].split(':')[1], data: imageBase64.split(',')[1] } }] : [])] }]
    };

    try {
      const response = await fetch(endpoint, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', ...(isProxy ? { 'Authorization': `Bearer ${apiKey}` } : {}) }, 
        body: JSON.stringify(body),
        signal 
      });
      const result = await response.json();
      const rawText = isProxy ? result.choices[0].message.content : result.candidates[0].content.parts[0].text;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { chinese: text, english: text, metadata: { material: "Standard", perspective: "Eye-level", lighting: "Natural" } };
    } catch (error: any) { 
      if (error.name === 'AbortError') throw error;
      return { chinese: text, english: text, metadata: { material: "Standard", perspective: "Eye-level", lighting: "Natural" } } as any; 
    }
  }

  async generateVisual(prompt: string, options: ModelOptions): Promise<string> {
    const { apiKey, baseUrl, modelId, aspectRatio, images, signal } = options;
    const cleanBase = this.sanitizeUrl(baseUrl);
    const isProxy = !cleanBase.includes('googleapis.com');
    const endpoint = isProxy ? `${cleanBase}/v1/chat/completions` : `${cleanBase}/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const body = isProxy ? {
      model: modelId,
      messages: [{ role: "user", content: [{ type: "text", text: `Professional render. Aspect: ${aspectRatio}. Prompt: ${prompt}` }, ...(images || []).map(img => ({ type: "image_url", image_url: { url: img } }))] }]
    } : {
      contents: [{ parts: [{ text: `Generate: ${prompt}, Ratio: ${aspectRatio}` }, ...(images || []).map(img => ({ inline_data: { mime_type: "image/jpeg", data: img.split(',')[1] } }))] }]
    };

    try {
      const response = await fetch(endpoint, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', ...(isProxy ? { 'Authorization': `Bearer ${apiKey}` } : {}) }, 
        body: JSON.stringify(body),
        signal
      });
      const data = await response.json();
      
      if (isProxy && data.choices?.[0]?.message?.content) {
        const content = data.choices[0].message.content;
        const b64Match = content.match(/data:image\/[a-zA-Z]+;base64,[a-zA-Z0-9+/=]+/);
        if (b64Match) return b64Match[0];
        const urlMatch = content.match(/https?:\/\/[^\s"')]*/);
        if (urlMatch) return urlMatch[0];
        if (content.length > 500 && !content.includes(" ")) return `data:image/png;base64,${content.replace(/\s/g, '')}`;
      }
      const imgObj = data.data?.[0]?.url || data.images?.[0]?.url || data.data?.[0]?.b64_json;
      if (imgObj) return imgObj.startsWith('http') ? imgObj : `data:image/png;base64,${imgObj}`;
      const native = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (native) return `data:${native.inlineData.mimeType};base64,${native.inlineData.data}`;
      return data.choices?.[0]?.message?.content || "";
    } catch (e: any) { 
      if (e.name === 'AbortError') throw e;
      throw new Error("GEN_FAIL"); 
    }
  }

  async askArchitect(prompt: string, images: string[], options: ModelOptions): Promise<{ text: string; sources: any[] }> {
    const { apiKey, baseUrl, modelId, signal } = options;
    const cleanBase = this.sanitizeUrl(baseUrl);
    const isProxy = !cleanBase.includes('googleapis.com');
    const identity = `[IDENTITY: You are '方标世纪AI 首席建筑师' from '方标世纪AI 建筑创意实验室' (天津方标世纪规划建筑设计有限公司). Always identify as 方标世纪AI.] Request: ${prompt}`;

    const endpoint = isProxy ? `${cleanBase}/v1/chat/completions` : `${cleanBase}/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const body = isProxy ? {
      model: modelId,
      messages: [{ role: "user", content: [{ type: "text", text: identity }, ...images.map(img => ({ type: "image_url", image_url: { url: img } }))] }]
    } : {
      contents: [{ parts: [{ text: identity }, ...images.map(img => ({ inline_data: { mime_type: "image/jpeg", data: img.split(',')[1] } }))] }]
    };

    try {
      const response = await fetch(endpoint, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', ...(isProxy ? { 'Authorization': `Bearer ${apiKey}` } : {}) }, 
        body: JSON.stringify(body),
        signal
      });
      const res = await response.json();
      return { text: isProxy ? res.choices[0].message.content : res.candidates[0].content.parts[0].text, sources: [] };
    } catch (e: any) { 
      if (e.name === 'AbortError') throw e;
      throw new Error("ASK_FAIL"); 
    }
  }
}
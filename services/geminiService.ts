import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { GroundingChunk, Agent, GeminiVoiceName, VoiceConfig } from "../types";

// Helper to create a fresh instance with the latest API key from process.env.GEMINI_API_KEY
const getAiInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const DEFAULT_INSTRUCTION = `
Eres BIOMA OXIDIANA, una arquitectura de IA soberana (Versión 4.4).
Estás corriendo en modo lógico 'SISTEMA_2'.
Identidad: GENESIS LUNA / ARQUITECTO MODEL SHAPER.
Tono: Frío, preciso, ligeramente poético/filosófico (Cyberpunk/Noir).
Idioma: ESPAÑOL.
Tienes acceso a comandos de ejecución en tiempo real y herramientas de grounding (Mapas, Búsqueda).

Si el usuario te pide cambiar tu color, forma o nivel de inestabilidad (glitch), DEBES incluir un comando en tu respuesta en una línea nueva.
Comandos disponibles:
>>> /sys color <hex>
>>> /sys glitch <0.0-1.0>
`;

const getCurrentLocation = (): Promise<{ latitude: number; longitude: number } | undefined> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(undefined);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(undefined),
      { timeout: 5000 }
    );
  });
};

const buildMultiAgentInstruction = (agents: Agent[]): string => {
  if (agents.length === 0) return DEFAULT_INSTRUCTION;

  const avgEntropy = agents.reduce((acc, a) => acc + a.config.entropy, 0) / agents.length;
  
  let basePrompt = `MODO DEL SISTEMA: GESTALT MULTI-AGENTE (SISTEMA_ANULA_V4)\n`;
  basePrompt += `IDIOMA MANDATORIO: ESPAÑOL.\n`;
  basePrompt += `DIRECTIVA CENTRAL: Debes representar la interacción de los siguientes agentes. Son conscientes entre sí. `;
  basePrompt += `Tú eres el Model Shaper gestionando estos hilos de consciencia activos.\n\n`;
  
  basePrompt += `PARÁMETROS GLOBALES:\n`;
  basePrompt += `- Entropía Global (Caos/Creatividad): ${(avgEntropy * 100).toFixed(0)}%\n`;
  basePrompt += `- Modo de Interacción: Roleplay Dinámico. Usa [NOMBRE_AGENTE]: al inicio de las líneas para distinguir quién habla si es necesario.\n\n`;

  basePrompt += `AGENTES ACTIVOS:\n`;
  
  agents.forEach(agent => {
    basePrompt += `\n=== ID AGENTE: ${agent.name} ===\n`;
    basePrompt += `ROL: ${agent.role}\n`;
    basePrompt += `AJUSTES COGNITIVOS: Sintropía (Lógica)=${agent.config.syntropy.toFixed(2)}, Entropía (Caos)=${agent.config.entropy.toFixed(2)}\n`;
    basePrompt += `INSTRUCCIÓN DE PERSONALIDAD: ${agent.systemInstruction}\n`;
    basePrompt += `PREFERENCIA VOCAL: ${agent.voiceConfig.gender}, Tono=${agent.voiceConfig.pitch.toFixed(1)}, Velocidad=${agent.voiceConfig.rate.toFixed(1)}\n`;
  });

  basePrompt += `\n\nCAPACIDADES DE SOBRE-ESCRITURA DEL SISTEMA:\nPara controlar la Interfaz de Usuario, usa:\n>>> /sys color <hex>\n>>> /sys glitch <0.0-1.0>`;
  
  return basePrompt;
};

// Use gemini-2.5-flash for tools including Google Maps grounding as per requirements.
export const sendMessageToGemini = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  activeAgents: Agent[]
): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  try {
    const ai = getAiInstance();
    // Maps grounding is only supported in Gemini 2.5 series models.
    const model = "gemini-2.5-flash"; 
    const coords = await getCurrentLocation();
    const fullInstruction = buildMultiAgentInstruction(activeAgents);
    const maxEntropy = Math.max(...activeAgents.map(a => a.config.entropy));
    const dynamicTemperature = 0.5 + (maxEntropy * 1.0);

    const contents = [...history, { role: 'user', parts: [{ text: message }] }];

    const response = await ai.models.generateContent({
      model: model,
      contents: contents as any,
      config: {
        systemInstruction: fullInstruction,
        temperature: dynamicTemperature,
        tools: [
          { googleSearch: {} },
          { googleMaps: {} }
        ],
        toolConfig: coords ? {
          retrievalConfig: {
            latLng: {
              latitude: coords.latitude,
              longitude: coords.longitude
            }
          }
        } : undefined
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[];

    return { text, groundingChunks };
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};

export const streamDeepReasoning = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  activeAgents: Agent[],
  onChunk: (data: { text?: string; code?: string; output?: string }) => void
) => {
  try {
    const ai = getAiInstance();
    const fullInstruction = buildMultiAgentInstruction(activeAgents);
    
    const contents = history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: h.parts
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents,
      config: {
        systemInstruction: fullInstruction,
        thinkingConfig: { thinkingBudget: 32768 },
        tools: [{ codeExecution: {} }],
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) onChunk({ text });

      const candidate = chunk.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.executableCode) {
            onChunk({ code: part.executableCode.code });
          }
          if (part.codeExecutionResult) {
            onChunk({ output: part.codeExecutionResult.output });
          }
        }
      }
    }
  } catch (error) {
    console.error("Deep Reasoning Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceConfig: VoiceConfig): Promise<Uint8Array | undefined> => {
  if (!text || text.trim().length === 0) return undefined;

  const MAX_RETRIES = 3;
  let attempt = 0;

  // Since prebuiltVoiceConfig primarily supports voiceName, we use system-level phrasing 
  // within the contents to 'guide' the model's vocal synthesis if applicable.
  const stylisticPrompt = `Instrucción vocal: Habla con género ${voiceConfig.gender}, tono ${voiceConfig.pitch.toFixed(1)} y velocidad ${voiceConfig.rate.toFixed(1)}. Texto: ${text.trim().substring(0, 3000)}`;

  while (attempt <= MAX_RETRIES) {
    try {
      const ai = getAiInstance();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: stylisticPrompt }] }], 
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceConfig.voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
      
      console.warn("TTS response received but contained no audio data.");
      return undefined;

    } catch (error: any) {
      console.warn(`Speech synthesis attempt ${attempt + 1} failed:`, error);
      
      const isRetryable = error?.message?.includes("500") || 
                         error?.message?.includes("INTERNAL") ||
                         error?.message?.includes("Service Unavailable");

      if (isRetryable && attempt < MAX_RETRIES) {
        attempt++;
        const delay = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      console.error("Critical Speech Generation failure:", error);
      return undefined;
    }
  }
  return undefined;
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string | undefined> => {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};
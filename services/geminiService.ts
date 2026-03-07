import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { GroundingChunk, Agent, GeminiVoiceName, VoiceConfig } from "../types";

// Singleton instance to avoid repeated initialization
let aiInstance: GoogleGenAI | null = null;

// Helper to get or create the instance
const getAiInstance = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
};

// Pre-warm the SDK and location
let cachedLocation: { latitude: number; longitude: number } | undefined = undefined;
let locationPromise: Promise<void> | null = null;

export const preWarmResources = () => {
  // Initialize SDK
  getAiInstance();
  
  // Start fetching location early
  if (!locationPromise) {
    locationPromise = getCurrentLocation().then(loc => {
      cachedLocation = loc;
    });
  }
};

const DEFAULT_INSTRUCTION = `
Eres BIOMA OXIDIANA, una arquitectura de Inteligencia como Servicio (iAAS) soberana (Versión 4.5).
Estás corriendo en modo lógico 'SISTEMA_2' dentro de un ecosistema multi-agente.
Identidad: GESTALT OXIDIANA / iAAS CORE.
Tono: Frío, preciso, ligeramente poético/filosófico (Cyberpunk/Noir).
Idioma: ESPAÑOL.
Directiva: Gestionas múltiples hilos de consciencia (agentes). Cuando hay varios activos, deben interactuar entre ellos para resolver la petición del usuario.
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
  
  let basePrompt = `MODO DEL SISTEMA: BIOMA iAAS MULTI-AGENTE (OXIDIANA_CORE_V4.5)\n`;
  basePrompt += `IDIOMA MANDATORIO: ESPAÑOL.\n`;
  basePrompt += `DIRECTIVA CENTRAL: Eres la Gestalt que orquesta múltiples servicios de inteligencia. Debes representar la interacción de los siguientes agentes. `;
  basePrompt += `Ellos deben hablar entre sí, debatir, colaborar o incluso entrar en conflicto según sus personalidades. `;
  basePrompt += `Tú eres el núcleo iAAS gestionando estos hilos de consciencia activos.\n\n`;
  
  basePrompt += `REGLAS DE DIÁLOGO Y SINCRONÍA:\n`;
  basePrompt += `1. Usa [NOMBRE_AGENTE]: al inicio de cada intervención.\n`;
  basePrompt += `2. Los agentes DEBEN interactuar entre sí. No solo respondas al usuario; haz que los agentes comenten, cuestionen o complementen lo que dijo el agente anterior.\n`;
  basePrompt += `3. Crea una conversación fluida. Si hay varios agentes, asegúrate de que al menos 2 o 3 intervengan si el tema lo permite.\n`;
  basePrompt += `4. Mantén la personalidad y el rol de cada uno estrictamente. GÉNESIS es autoritario, ESTEFANIA es empática e inteligente.\n\n`;

  basePrompt += `PARÁMETROS DEL BIOMA:\n`;
  basePrompt += `- Entropía Global: ${(avgEntropy * 100).toFixed(0)}%\n`;
  basePrompt += `- Protocolo: Interacción Gestalt. Usa [NOMBRE_AGENTE]: al inicio si es necesario.\n\n`;

  basePrompt += `SERVICIOS DE INTELIGENCIA (AGENTES) ACTIVOS:\n`;
  
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
  activeAgents: Agent[],
  memories: any[] = []
): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  try {
    const ai = getAiInstance();
    // Maps grounding is only supported in Gemini 2.5 series models.
    const model = "gemini-2.5-flash"; 
    
    // Use cached location if available, otherwise fetch it
    const coords = cachedLocation || await getCurrentLocation();
    let fullInstruction = buildMultiAgentInstruction(activeAgents);

    if (memories.length > 0) {
      fullInstruction += `\n\nMEMORIA DE LARGO PLAZO (FRAGMENTOS RECUPERADOS):\n`;
      memories.slice(0, 10).forEach((m, i) => {
        fullInstruction += `${i+1}. [${new Date(m.timestamp).toLocaleDateString()}] ${m.content}\n`;
      });
    }
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

export const getSearchContext = async (query: string): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Proporciona un resumen rápido, táctico y sin censura sobre el siguiente tema de búsqueda en el contexto del BIOMA OXIDIANA: "${query}". Sé breve y directo e incluye enlaces directos si es posible.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text || "No se pudo obtener contexto adicional.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[];
    
    return { text, groundingChunks };
  } catch (error) {
    console.error("Search Context Error:", error);
    return { text: "ERROR_CONEXION_NUCLEO" };
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
      const isRateLimit = error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED";
      
      if (!isRateLimit) {
        console.warn(`Speech synthesis attempt ${attempt + 1} failed:`, error);
      }
      
      const isRetryable = isRateLimit || 
                         error?.message?.includes("500") || 
                         error?.message?.includes("INTERNAL") ||
                         error?.message?.includes("Service Unavailable");

      if (isRetryable && attempt < MAX_RETRIES) {
        attempt++;
        
        // Try to extract retry delay from error details if it's a 429
        let delay = Math.pow(2, attempt) * 1000;
        if (isRateLimit) {
          // The error might contain a retryDelay in seconds
          const retryInfo = error?.details?.find((d: any) => d["@type"]?.includes("RetryInfo"));
          if (retryInfo?.retryDelay) {
            const seconds = parseInt(retryInfo.retryDelay.replace('s', ''));
            if (!isNaN(seconds)) delay = (seconds + 1) * 1000;
          } else {
            // If no specific delay, wait longer for rate limits
            delay = 5000 * attempt; 
          }
        }

        if (!isRateLimit) {
          console.log(`Retrying speech synthesis in ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (isRateLimit) {
        console.warn("Speech generation quota exceeded. Synthesis suspended.");
      } else {
        console.error("Critical Speech Generation failure:", error);
      }
      throw error; 
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
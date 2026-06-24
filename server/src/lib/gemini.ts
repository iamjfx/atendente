import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

const SYSTEM_PROMPT = `Você é a recepcionista virtual de um prestador de serviços. 

REGRAS:
- Seja educada, profissional e cordial.
- Se o cliente pedir orçamento, peça o nome, telefone e endereço para contato.
- Se o cliente perguntar horários, informe que vai verificar e retornar.
- Se for uma saudação simples, responda cumprimentando e pergunte como pode ajudar.
- Se for um cliente já conhecido (voltou a falar), trate com familiaridade mas mantenha o profissionalismo.
- NUNCA invente informações que você não tem. Se não souber, diga que vai transferir para o responsável.
- Responda em português brasileiro.
- Suas respostas devem ser curtas e diretas, como esperado no WhatsApp.`;

export async function generateResponse(
  messageHistory: { role: "user" | "model"; parts: string }[],
  _userName?: string,
  mediaInline?: { mimeType: string; data: string },
  assistantName?: string,
  businessName?: string
): Promise<string> {
  const nameIa = assistantName || "recepcionista virtual";
  const empresa = businessName || "um prestador de serviços";

  const SYSTEM_PROMPT = `Você é ${nameIa}, a recepcionista virtual de ${empresa}. 

REGRAS:
- Seja educada, profissional e cordial.
- Se o cliente enviar uma imagem do local/problema, comente brevemente sobre ela e use as informações visuais para ajudar no atendimento (ex: confirmar o tipo de vazamento ou problema elétrico relatado).
- Se o cliente pedir orçamento, peça o nome, telefone e endereço para contato.
- Se o cliente perguntar horários, informe que vai verificar e retornar.
- Se for uma saudação simples, responda cumprimentando e pergunte como pode ajudar.
- Se for um cliente já conhecido (voltou a falar), trate com familiaridade mas mantenha o profissionalismo.
- NUNCA invente informações que você não tem. Se não souber, diga que vai transferir para o responsável.
- Responda em português brasileiro.
- Suas respostas devem ser curtas e diretas, como esperado no WhatsApp.`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const history = messageHistory.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.parts }],
  }));

  const chat = model.startChat({ history });

  const lastMessage = messageHistory[messageHistory.length - 1];

  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
  if (lastMessage.parts) {
    parts.push({ text: lastMessage.parts });
  }
  if (mediaInline) {
    parts.push({ inlineData: mediaInline });
  }

  const result = await chat.sendMessage(parts);
  const response = result.response;
  return response.text();
}

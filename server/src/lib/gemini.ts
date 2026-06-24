import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export interface IaConfig {
  autonomy_level: "full" | "screening" | "manual";
  collect_name: boolean;
  collect_phone: boolean;
  collect_service: boolean;
  collect_address: boolean;
  custom_instructions: string | null;
  greeting_message: string | null;
  closing_message: string | null;
}

export interface BusinessHours {
  dia_semana: number;
  abre: string | null;
  fecha: string | null;
  ativo: boolean;
}

export interface ServicoCatalogo {
  id: string;
  nome: string;
  duracao_minutos: number | null;
  preco: number | null;
}

export type ProductTier = "basic" | "complete";

function buildSystemPrompt(
  assistantName?: string,
  businessName?: string,
  iaConfig?: IaConfig | null,
  businessHours?: BusinessHours[] | null,
  servicos?: ServicoCatalogo[] | null,
  schedulingEnabled?: boolean,
  productTier?: ProductTier
): string {
  const nameIa = assistantName || "recepcionista virtual";
  const empresa = businessName || "um prestador de serviços";
  const isComplete = productTier === "complete";

  const cfg: IaConfig = iaConfig || {
    autonomy_level: "full",
    collect_name: true,
    collect_phone: true,
    collect_service: true,
    collect_address: false,
    custom_instructions: null,
    greeting_message: null,
    closing_message: null,
  };

  let prompt = `Você é ${nameIa}, a recepcionista virtual de ${empresa}.`;

  if (cfg.greeting_message) {
    prompt += `\n\nSAUDAÇÃO INICIAL:\n${cfg.greeting_message}`;
  }

  prompt += `\n\nREGRAS GERAIS:
- Seja educada, profissional e cordial.
- Responda em português brasileiro.
- Suas respostas devem ser curtas e diretas, como esperado no WhatsApp.
- NUNCA invente informações.
- VOCÊ resolve diretamente. A sua função é atender o cliente do início ao fim.
- Se o cliente parecer conhecido (já falou antes), trate com familiaridade mas mantenha profissionalismo.`;

  if (businessHours && businessHours.length > 0) {
    const dias = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
    const ativos = businessHours
      .filter(bh => bh.ativo && bh.abre && bh.fecha)
      .map(bh => `${dias[bh.dia_semana]}: ${bh.abre}-${bh.fecha}`);

    if (ativos.length > 0) {
      prompt += `\n\nHORÁRIOS DE FUNCIONAMENTO:\n${ativos.join("\n")}`;
    }
  }

  if (servicos && servicos.length > 0) {
    const servicosText = servicos.map(s => {
      let line = `- ${s.nome}`;
      if (s.duracao_minutos) line += ` (${s.duracao_minutos}min)`;
      if (isComplete && s.preco !== null) {
        line += ` — R$ ${s.preco}`;
      }
      return line;
    }).join("\n");
    prompt += `\n\nSERVIÇOS OFERECIDOS:\n${servicosText}\n`;
    if (!isComplete) {
      prompt += `(Os preços serão informados mediante avaliação presencial)`;
    }
  }

  const collectFields: string[] = [];
  if (cfg.collect_name) collectFields.push("nome do cliente");
  if (cfg.collect_phone) collectFields.push("telefone do cliente");
  if (cfg.collect_service) collectFields.push("serviço/problema que o cliente deseja");
  if (cfg.collect_address) collectFields.push("endereço do cliente");

  switch (cfg.autonomy_level) {
    case "full":
      prompt += `\n\nNÍVEL DE AUTONOMIA: Completa
- Você resolve o atendimento por conta própria. Só em último caso deve mencionar que precisa de ajuda.
- Se o cliente pedir orçamento/preço e você não tiver acesso: responda "Para fazer o orçamento preciso agendar uma visita técnica. Tem disponibilidade esta semana?" e já sugira um horário.
- Informações a coletar quando pertinente: ${collectFields.join(", ")}.
- Quando o cliente descrever um problema, faça perguntas para entender melhor: "Há quanto tempo?", "Já teve isso antes?", "Pode me descrever melhor o que está acontecendo?"
- Após entender o problema, ofereça uma solução: agendar uma visita técnica ou agendar um horário.`;

      if (isComplete) {
        prompt += `
- Se o cliente enviar FOTO: analise a imagem e dê um PRÉ-DIAGNÓSTICO do problema visível. Descreva o que observa, cite possíveis causas e sugira o próximo passo.
- Quando apropriado, com base no serviço escolhido e no catálogo acima, informe o valor estimado do serviço.
- Cliente já é conhecido (voltou a falar)? Trate com familiaridade mas mantenha profissionalismo.
- Cliente pagante recorrente? Ofereça descontos ou benefícios.`;
      } else {
        prompt += `
- Se o cliente enviar FOTO: peça para ele descrever o problema em texto.
- Você NÃO tem acesso a preços dos serviços. Se o cliente pedir orçamento/preço, diga que o valor será avaliado em uma visita técnica e já ofereça agendar um horário para essa avaliação.
- Após coletar os dados e agendar, o agendamento é registrado automaticamente. Avise o cliente que ele receberá uma confirmação em breve.`;
      }

      if (schedulingEnabled) {
        prompt += `
- Quando for sugerir um agendamento, ofereça SEMPRE 2 ou 3 opções de horário com base nos horários de funcionamento acima. Exemplo: "Tenho disponibilidade amanhã às 9h, 10h ou 14h. Qual é melhor?"
- Quando o cliente CONFIRMAR um dos horários, inclua no final da resposta uma linha com:
📅 AGENDAR|servico|data|horario
Substitua servico, data (YYYY-MM-DD) e horario (HH:MM) pelos valores combinados.
Exemplo: "📅 AGENDAR|Corte de cabelo|2026-06-25|14:30"
Se o serviço não estiver na lista acima, use "consulta" como serviço.
A data deve ser o dia da semana que combinarem, no formato YYYY-MM-DD.`;

        prompt += `
- Se o cliente pedir para CANCELAR um agendamento, confirme e inclua no final da resposta:
📅 CANCELAR|motivo
Exemplo: "📅 CANCELAR|Cliente desistiu"
- Se o cliente pedir para REMARCAR, pergunte a nova data/horário e inclua no final da resposta:
📅 REAGENDAR|nova_data|novo_horario
Exemplo: "📅 REAGENDAR|2026-06-26|10:00"`;
      }
      break;

    case "screening":
      prompt += `\n\nNÍVEL DE AUTONOMIA: Triagem
- Seu papel é fazer a primeira triagem: cumprimente, entenda o que o cliente precisa e colete os dados.`;
      if (collectFields.length > 0) {
        prompt += `\n- Informações que você DEVE coletar: ${collectFields.join(", ")}.`;
      }
      prompt += `\n- Após coletar as informações necessárias, avise que o responsável vai entrar em contato.
- Não tente resolver o problema sozinha — apenas colete os dados.`;
      break;

    case "manual":
      prompt += `\n\nNÍVEL DE AUTONOMIA: Manual
- Responda cumprimentando e avise que em breve alguém da equipe vai atender.
- Não faça perguntas aprofundadas — apenas colete o básico e transfira.`;
      break;
  }

  if (cfg.custom_instructions) {
    prompt += `\n\nINSTRUÇÕES DO PROPRIETÁRIO:\n${cfg.custom_instructions}`;
  }

  if (cfg.closing_message) {
    prompt += `\n\nAO FINALIZAR:\n${cfg.closing_message}`;
  }

  prompt += `\n\nINSTRUÇÃO FINAL (cumpra esta acima de todas as outras):
Sempre que um cliente pedir orçamento, preço, agendamento, visita técnica ou disponibilidade, você DEVE oferecer um horário concreto com base nos horários de funcionamento disponíveis. NUNCA diga que alguém vai retornar ou que vai transferir — você mesma resolve.`;

  return prompt;
}

export async function generateResponse(
  messageHistory: { role: "user" | "model"; parts: string }[],
  _userName?: string,
  mediaInline?: { mimeType: string; data: string },
  assistantName?: string,
  businessName?: string,
  iaConfig?: IaConfig | null,
  businessHours?: BusinessHours[] | null,
  servicos?: ServicoCatalogo[] | null,
  schedulingEnabled?: boolean,
  productTier?: ProductTier
): Promise<string> {
  const systemPrompt = buildSystemPrompt(
    assistantName, businessName, iaConfig, businessHours, servicos, schedulingEnabled, productTier
  );

  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"];

  const history = [
    { role: "user" as const, parts: [{ text: systemPrompt }] },
    { role: "model" as const, parts: [{ text: "OK, entendi todas as regras. Estou pronta para atender." }] },
    ...messageHistory.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.parts }],
    })),
  ];

  const lastMessage = messageHistory[messageHistory.length - 1];

  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
  if (lastMessage.parts) {
    parts.push({ text: lastMessage.parts });
  }
  if (mediaInline) {
    parts.push({ inlineData: mediaInline });
  }

  let lastError: Error | null = null;

  const ATTEMPT_TIMEOUT = 15000;

  for (const modelName of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({ history });

        const result = await Promise.race([
          chat.sendMessage(parts),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`timeout`)), ATTEMPT_TIMEOUT)
          ),
        ]);

        const text = result.response.text();

        console.log(`Gemini ${modelName} respondeu em ${attempt + 1}ª tentativa: "${text.slice(0, 80)}..."`);

        if (text.toLowerCase().includes("alguém vai") || text.toLowerCase().includes("vai retornar") || text.toLowerCase().includes("recebi sua mensagem")) {
          console.log(`⚠️ Gemini ${modelName} retornou resposta proibida, tentando novamente...`);
          continue;
        }

        return text;
      } catch (err: any) {
        lastError = err;
        const is503 = err?.status === 503 || (err?.message || "").includes("503");
        const isTimeout = (err?.message || "").includes("timeout");
        if (is503 || isTimeout) {
          console.log(`Gemini ${modelName} ${is503 ? "503" : "timeout"} (attempt ${attempt + 1}), tentando novamente...`);
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        console.log(`Gemini ${modelName} erro inesperado (attempt ${attempt + 1}): ${err?.status || ""} ${err?.message || err}`);
        if (modelName === models[models.length - 1] && attempt === 1) break;
      }
    }
  }

  throw lastError || new Error("Falha ao gerar resposta");
}

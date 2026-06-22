import { supabase } from "../lib/supabase.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export async function checkAndRegisterLead(
  conversationId: string,
  remoteJid: string,
  accountId: string,
  history: { role: "user" | "model"; parts: string }[]
) {
  try {
    // 1. Check if we already have an active budget for this conversation in the last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const phoneStr = remoteJid.replace(/[^0-9]/g, "").slice(0, 11);

    const { data: existingOrc } = await supabase
      .from("orcamentos")
      .select("id")
      .eq("user_id", accountId)
      .eq("telefone", phoneStr)
      .eq("status", "pendente")
      .gte("created_at", threeDaysAgo.toISOString())
      .limit(1);

    if (existingOrc && existingOrc.length > 0) {
      // Already qualified/created a budget for this client recently
      return;
    }

    // 2. Call Gemini to check qualification status
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const conversationText = history
      .map((h) => `${h.role === "user" ? "Cliente" : "Atendente IA"}: ${h.parts}`)
      .join("\n");

    const qualificationPrompt = `
Dada a seguinte conversa com o cliente no WhatsApp, determine se o cliente informou dados suficientes para criarmos um lead ou proposta de serviço qualificada.
Requisitos mínimos para qualificação:
- O cliente informou o NOME dele.
- O cliente descreveu o SERVIÇO ou PROBLEMA que precisa (ex: vazamento, pintura, conserto de geladeira, limpeza, etc).

Gere um objeto JSON contendo:
{
  "qualified": boolean (true se preencher os requisitos mínimos, false caso contrário),
  "clientName": string (Nome do cliente extraído, null se não encontrado),
  "service": string (Resumo do serviço/problema, null se não encontrado),
  "description": string (Explicação detalhada do serviço ou do problema relatado, null se não encontrado),
  "address": string (Endereço completo se mencionado, null se não encontrado),
  "estimatedValue": number (Caso o cliente ou a conversa mencione valores negociados, senão use 0)
}

Conversa:
${conversationText}
`;

    const result = await model.generateContent(qualificationPrompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    if (!data.qualified || !data.clientName || !data.service) {
      return;
    }

    console.log(`Lead qualificado detectado para ${data.clientName} (${phoneStr})! Registrando...`);

    // 3. Find or Create Client in the database
    let clienteId: string | null = null;
    const { data: existingClient } = await supabase
      .from("clientes")
      .select("id")
      .eq("user_id", accountId)
      .eq("telefone", phoneStr)
      .maybeSingle();

    if (existingClient) {
      clienteId = existingClient.id;
    } else {
      // Split address if extracted
      let rua = null, cidade = null, uf = null;
      if (data.address) {
        rua = data.address;
        // Simple default values
        cidade = "São Paulo";
        uf = "SP";
      }

      const { data: newClient, error: clientErr } = await supabase
        .from("clientes")
        .insert({
          user_id: accountId,
          nome: data.clientName,
          telefone: phoneStr,
          rua,
          cidade,
          uf,
        })
        .select("id")
        .single();

      if (!clientErr && newClient) {
        clienteId = newClient.id;
      }
    }

    // 4. Create the budget (orcamentos)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 15);

    const descriptionText = [
      data.description,
      data.address ? `Endereço fornecido: ${data.address}` : null
    ].filter(Boolean).join("\n\n");

    const { error: orcErr } = await supabase.from("orcamentos").insert({
      user_id: accountId,
      cliente_id: clienteId,
      cliente_nome: data.clientName,
      telefone: phoneStr,
      servico: data.service,
      descricao: descriptionText || "Proposta gerada automaticamente pelo Atendente IA",
      valor: data.estimatedValue || 0,
      valido_ate: validUntil.toISOString().split("T")[0],
      status: "pendente",
    });

    if (orcErr) {
      console.error("Erro ao criar orçamento para lead qualificado:", orcErr.message);
    } else {
      console.log(`✅ Orçamento de lead qualificado criado com sucesso para ${data.clientName}!`);
    }

  } catch (err: any) {
    console.error("Erro no processador de qualificação de leads:", err.message);
  }
}

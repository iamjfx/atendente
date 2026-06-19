import { useState, useEffect, useCallback } from "react";

type ChatMessage = {
  side: "client" | "ai";
  text: string;
  time: string;
};

const CHATS: ChatMessage[][] = [
  [
    { side: "client", text: "Olá! Gostaria de agendar um horário pra essa semana.", time: "14:23" },
    { side: "ai", text: "Olá! 😊 Com certeza! Poderia me informar seu nome e qual serviço você precisa?", time: "14:23" },
    { side: "client", text: "Sou o Rafael, preciso de um eletricista pra trocar uma tomada.", time: "14:24" },
    { side: "ai", text: "Ótimo, Rafael! Qual endereço do serviço?", time: "14:24" },
    { side: "client", text: "Rua Augusta, 1500 — apto 42.", time: "14:25" },
  ],
  [
    { side: "client", text: "Rua Augusta, 1500 — apto 42.", time: "14:25" },
    { side: "ai", text: "Perfeito! ⏰ Tenho estes horários disponíveis:\n\n• Hoje 16:00\n• Amanhã 09:00\n• Amanhã 14:00\n\nQual funciona melhor pra você?", time: "14:25" },
    { side: "client", text: "Amanhã 09:00 fica ótimo!", time: "14:26" },
    { side: "ai", text: "Anotado! ✅ Confirmando agendamento pra amanhã às 09:00.\n\nVou enviar um lembrete no dia. Qualquer alteração é só me avisar!", time: "14:26" },
  ],
  [
    { side: "ai", text: "🔔 **Agendamento Confirmado!**\n\nServiço: Troca de tomada\nData: Amanhã, 09:00\nEndereço: Rua Augusta, 1500\nProfissional: Carlos (Eletricista)\n\nEnviaremos um lembrete 1h antes.", time: "14:27" },
    { side: "client", text: "Perfeito, obrigado!", time: "14:28" },
    { side: "ai", text: "Por nada, Rafael! 😊 Estaremos lá pontualmente. Qualquer dúvida é só chamar.", time: "14:28" },
  ],
];

function ChatScreen({ messages }: { messages: ChatMessage[] }) {
  return (
    <>
      <div className="bg-[#075E54] px-3 pt-3 pb-1 flex items-center justify-between text-[9px] text-white">
        <span>9:41</span>
        <span className="flex gap-0.5">●●●●○</span>
      </div>
      <div className="bg-[#075E54] px-3 pb-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#128C7E] flex items-center justify-center text-white text-[10px] font-bold shrink-0">A</div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[11px] font-semibold">Atendente</p>
          <p className="text-[#8EC1B6] text-[8px]">online</p>
        </div>
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </div>
      <div className="flex-1 bg-[#E5DDD5] p-2.5 space-y-1.5 overflow-y-auto" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d1d7db' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.side === "client" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[10px] leading-relaxed shadow-sm ${
              msg.side === "client"
                ? "bg-white text-[#303030] rounded-tl-none"
                : "bg-[#DCF8C6] text-[#303030] rounded-tr-none"
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-[7px] mt-0.5 ${msg.side === "client" ? "text-[#848484]" : "text-[#7b8f68]"}`}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#F0F0F0] px-2 py-1.5 flex items-center gap-1.5">
        <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[#8B8B8B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[9px] text-[#8B8B8B] flex-1">Digite uma mensagem...</span>
          <svg className="w-3.5 h-3.5 text-[#8B8B8B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </div>
        <div className="w-7 h-7 rounded-full bg-[#128C7E] flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      </div>
    </>
  );
}

const SCREENS = [
  { id: "chat1", component: ChatScreen, props: { messages: CHATS[0] } },
  { id: "chat2", component: ChatScreen, props: { messages: CHATS[1] } },
  { id: "chat3", component: ChatScreen, props: { messages: CHATS[2] } },
];

export default function PhoneMockup({ screenIndex }: { screenIndex?: number }) {
  const [visible, setVisible] = useState(screenIndex ?? 0);

  const switchTo = useCallback((idx: number) => setVisible(idx), []);

  useEffect(() => {
    if (screenIndex !== undefined) return;
    const timer = setInterval(() => setVisible(v => (v + 1) % SCREENS.length), 5000);
    return () => clearInterval(timer);
  }, [screenIndex]);

  useEffect(() => {
    if (screenIndex !== undefined) setVisible(screenIndex);
  }, [screenIndex]);

  const Screen = SCREENS[visible].component;
  const screenProps = SCREENS[visible].props;

  return (
    <div className="relative mx-auto w-[220px] md:w-[260px]">
      <div className="relative bg-neutral-900 rounded-[2.75rem] p-2 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-neutral-900 rounded-b-2xl z-20 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-neutral-700" />
        </div>
        <div className="relative w-full aspect-[9/19.5] bg-[#E5DDD5] rounded-[2rem] overflow-hidden flex flex-col">
          <Screen {...screenProps} />
        </div>
      </div>
      {screenIndex === undefined && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {SCREENS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => switchTo(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                idx === visible ? "bg-primary w-4" : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

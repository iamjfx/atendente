import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageCircle, CalendarDays, Bot, Smartphone,
  ChevronRight, BarChart3, Users, Sparkles, ArrowRight, Clock,
  Menu, X,
} from "lucide-react";
import PhoneMockup from "@/components/PhoneMockup";

const Logo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="hsl(220,78%,48%)" />
    <path d="M6 13.5C6 10.462 8.462 8 11.5 8H12.5C15.538 8 18 10.462 18 13.5C18 16.538 15.538 19 12.5 19H11.5C10.5 19 9.5 18.5 9 18L6 19L7 16.5C6.5 15.8 6 14.8 6 13.5Z" fill="white" />
    <circle cx="10" cy="12" r="0.5" fill="hsl(220,78%,48%)" /><circle cx="12" cy="12" r="0.5" fill="hsl(220,78%,48%)" /><circle cx="14" cy="12" r="0.5" fill="hsl(220,78%,48%)" />
  </svg>
);

const messages = [
  { id: 1, name: "Carlos", text: "Olá, gostaria de fazer um orçamento pra pintar 3 cômodos", time: "08:30", emoji: "", day: "seg", service: "Pintura de 3 cômodos" },
  { id: 2, name: "Maria", text: "Bom dia, quando consegue passar pra ver o quadro elétrico?", time: "10:00", emoji: "", day: "seg", service: "Verificação de quadro elétrico" },
  { id: 3, name: "José", text: "Preciso de um eletricista urgente 😰 o disjuntor queimou e apagou tudo aqui", time: "10:45", emoji: "😰", day: "seg", service: "Troca de disjuntor" },
  { id: 4, name: "Fernanda", text: "Quanto fica pra instalar um chuveiro novo? Tem urgência 🔥", time: "11:30", emoji: "🔥", day: "seg", service: "Instalação de chuveiro" },
  { id: 5, name: "Ricardo", text: "Pode vir hoje ver um vazamento no banheiro?", time: "13:15", emoji: "", day: "seg", service: "Reparo de vazamento" },
  { id: 6, name: "Juliana", text: "⚠️ O ar condicionado parou do nada, tá um calor aqui 🥵", time: "14:00", emoji: "⚠️", day: "seg", service: "Manutenção de ar condicionado" },
  { id: 7, name: "Pedro", text: "Pode vir amanhã de manhã ver o vazamento?", time: "08:00", emoji: "", day: "ter", service: "Conserto de vazamento" },
  { id: 8, name: "Lúcia", text: "🔴 Emergência!!! O chuveiro tá vazando água no banheiro inteiro", time: "09:00", emoji: "🔴", day: "ter", service: "Vazamento no chuveiro" },
  { id: 9, name: "Marcos", text: "Instalação de ventilador de teto, quanto fica?", time: "10:30", emoji: "", day: "ter", service: "Instalação de ventilador" },
  { id: 10, name: "Carla", text: "O portão elétrico não abre mais 🆘 não consigo sair de casa", time: "14:00", emoji: "🆘", day: "ter", service: "Reparo de portão elétrico" },
  { id: 11, name: "Rogério", text: "Faz orçamento de encanamento pro banheiro?", time: "15:30", emoji: "", day: "ter", service: "Encanamento do banheiro" },
  { id: 12, name: "Patrícia", text: "🚨🚨 A CAIXA D'ÁGUA ESTOUROU, tá inundando o quintal!!!!", time: "07:30", emoji: "🚨", day: "qua", service: "Vazamento de caixa d'água" },
  { id: 13, name: "Eduardo", text: "Troca de registro de água, faz esse serviço?", time: "09:00", emoji: "", day: "qua", service: "Troca de registro de água" },
  { id: 14, name: "Camila", text: "Bom dia! Preciso de um orçamento pra reformar o banheiro inteiro", time: "10:00", emoji: "", day: "qua", service: "Reforma do banheiro" },
  { id: 15, name: "Luciano", text: "😰 A máquina de lavar tá vazando e alagando a área, pode vir urgente?", time: "11:30", emoji: "😰", day: "qua", service: "Vazamento na máquina de lavar" },
  { id: 16, name: "Tatiane", text: "Instalação de torneira nova na cozinha", time: "15:00", emoji: "", day: "qua", service: "Instalação de torneira" },
  { id: 17, name: "Roberto", text: "Faz manutenção em aquecedor a gás?", time: "08:30", emoji: "", day: "qui", service: "Manutenção de aquecedor a gás" },
  { id: 18, name: "Simone", text: "⚠️⚠️ A fiação do quarto está fazendo curto, ajuda pelo amor de Deus ⚠️⚠️", time: "10:00", emoji: "⚠️", day: "qui", service: "Curto-circuito na fiação" },
  { id: 19, name: "André", text: "Pode fazer orçamento de pintura externa?", time: "13:30", emoji: "", day: "qui", service: "Pintura externa" },
  { id: 20, name: "Débora", text: "A campainha não funciona mais", time: "16:00", emoji: "", day: "qui", service: "Conserto de campainha" },
  { id: 21, name: "Sandra", text: "Pode vir hoje? O encanamento estourou, tô desesperada 😰😰", time: "08:00", emoji: "😰", day: "sex", service: "Vazamento no encanamento" },
  { id: 22, name: "Fábio", text: "🔴🔴🔴 Não aguento mais, a goteira no teto não para nunca", time: "09:30", emoji: "🔴", day: "sex", service: "Goteira no teto" },
  { id: 23, name: "Alice", text: "Consegue trocar o chuveiro hoje à tarde?", time: "13:00", emoji: "", day: "sex", service: "Troca de chuveiro" },
  { id: 24, name: "Vinícius", text: "Quero automatizar o portão, faz esse serviço?", time: "15:30", emoji: "", day: "sex", service: "Automação de portão" },
];

const avatarColors = [
  "hsl(220,78%,48%)", "hsl(330,80%,58%)", "hsl(38,92%,50%)", "hsl(152,55%,42%)",
  "hsl(260,65%,58%)", "hsl(354,75%,58%)", "hsl(170,75%,40%)", "hsl(25,85%,55%)",
  "hsl(200,70%,50%)", "hsl(340,75%,50%)", "hsl(50,90%,45%)", "hsl(160,60%,40%)",
  "hsl(280,60%,55%)", "hsl(10,80%,55%)", "hsl(190,70%,45%)", "hsl(320,75%,50%)",
  "hsl(80,60%,40%)", "hsl(350,80%,55%)", "hsl(230,65%,50%)", "hsl(30,85%,50%)",
  "hsl(145,65%,40%)", "hsl(300,70%,50%)", "hsl(210,75%,45%)", "hsl(15,80%,55%)",
];

const heroPositions: { top: number; left: number }[] = [];
for (let i = 0; i < 24; i++) {
  const row = Math.floor(i / 4);
  const col = i % 4;
  const jitterX = (i * 7 + 3) % 7 - 3;
  const jitterY = (i * 13 + 7) % 7 - 3;
  heroPositions.push({
    top: 10 + row * 14 + jitterY,
    left: 15 + col * 22 + jitterX,
  });
}

const rotVals = [-7, 5, -4, 6, -9, 7, -5, 4, -6, 8, -3, 5, -8, 6, -4, 7, -5, 9, -6, 4, -7, 8, -3, 6];

const floatOffsets: { x: number; y: number }[] = [];
for (let i = 0; i < 24; i++) {
  floatOffsets.push({
    x: (i * 5 + 2) % 12 - 6,
    y: (i * 7 + 3) % 14 - 7,
  });
}

const avatarLetters = messages.map(m => m.name.slice(0, 2).toUpperCase());

const days = [
  { key: "seg", label: "Seg", full: "Segunda" },
  { key: "ter", label: "Ter", full: "Terça" },
  { key: "qua", label: "Qua", full: "Quarta" },
  { key: "qui", label: "Qui", full: "Quinta" },
  { key: "sex", label: "Sex", full: "Sexta" },
];

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

const depthScales = [
  1.35, 0.75, 1.5, 0.85, 1.1, 0.65,
  0.9, 1.4, 0.7, 1.25, 0.8, 1.45,
  0.95, 1.3, 0.6, 1.15, 0.85, 1.5,
  0.7, 1.2, 1.4, 0.75, 1.0, 0.65,
];

const baseWidths = [
  320, 180, 350, 200, 260, 160,
  210, 340, 170, 300, 190, 360,
  220, 310, 150, 280, 200, 340,
  170, 290, 330, 180, 250, 160,
];

export default function Index() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const agendaRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const rafRef = useRef(0);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const updatePositions = useCallback(() => {
    const hero = heroRef.current;
    const agenda = agendaRef.current;
    if (!hero || !agenda) return;

    const heroRect = hero.getBoundingClientRect();
    const agendaRect = agenda.getBoundingClientRect();
    const windowH = window.innerHeight;
    const windowW = window.innerWidth;

    const startScroll = heroRect.height;
    const endScroll = startScroll + 300;
    const rawProgress = Math.max(0, Math.min(1, (windowH - agendaRect.top) / endScroll));
    const p = easeOutQuart(rawProgress);

    setProgress(rawProgress);

    messages.forEach((_msg, i) => {
      const bubble = bubbleRefs.current[i];
      if (!bubble) return;

      const startX = (heroPositions[i].left / 100) * windowW;
      const startY = (heroPositions[i].top / 100) * windowH;

      const slot = slotRefs.current[i];
      let endX = startX;
      let endY = startY + 200;
      if (slot) {
        const r = slot.getBoundingClientRect();
        endX = r.left + r.width / 2;
        endY = r.top + r.height / 2;
      }

      const x = startX + (endX - startX) * p;
      const y = startY + (endY - startY) * p;
      const base = depthScales[i];
      const scale = base + (0.65 - base) * Math.min(1, p * 1.8);

      const floatAmt = Math.max(0, 1 - p * 2);
      const floatPhase = Math.sin(performance.now() / 800 * (2 + i * 0.15) + i * 1.2);
      const floatX = floatOffsets[i].x * floatAmt * floatPhase;
      const floatY = floatOffsets[i].y * floatAmt * floatPhase;

      const rot = rotVals[i] * Math.max(0, 1 - p * 1.5);
      const finalX = x + floatX;
      const finalY = y + floatY;

      bubble.style.transform = `translate(-50%,-50%) translate(${finalX}px,${finalY}px) rotate(${rot}deg) scale(${scale})`;
      bubble.style.opacity = String(1 - Math.max(0, Math.min(1, (rawProgress - 0.6) / 0.15)));
    });

    const wordWindows = [
      { el: badgeRef.current, start: 0.0, end: 0.10 },
      { el: wordRefs.current[0], start: 0.0, end: 0.10 },
      { el: wordRefs.current[1], start: 0.06, end: 0.16 },
      { el: wordRefs.current[2], start: 0.12, end: 0.24 },
      { el: wordRefs.current[3], start: 0.20, end: 0.34 },
    ];
    wordWindows.forEach(({ el, start, end }) => {
      if (!el) return;
      const t = Math.max(0, Math.min(1, (rawProgress - start) / (end - start)));
      const eased = 1 - Math.pow(1 - t, 3);
      el.style.opacity = String(eased);
      el.style.transform = `translateY(${(1 - eased) * 40}px)`;
    });

    if (subtitleRef.current) {
      const t = Math.max(0, Math.min(1, (rawProgress - 0.30) / 0.15));
      const eased = 1 - Math.pow(1 - t, 3);
      subtitleRef.current.style.opacity = String(eased);
      subtitleRef.current.style.transform = `translateY(${(1 - eased) * 24}px)`;
    }

    rafRef.current = requestAnimationFrame(updatePositions);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(rafRef.current);
  }, [updatePositions]);

  const steps = [
    { num: "01", title: "Cliente chega 💬", desc: "Manda um WhatsApp perguntando horário. A IA responde na hora, mesmo enquanto você trabalha.", screen: 0 },
    { num: "02", title: "IA faz a triagem 🤖", desc: "Extrai nome, endereço, descrição do problema. Pergunta o que falta. Nada de formulário.", screen: 1 },
    { num: "03", title: "Sugere e agenda 📅", desc: "Confere seus horários, propõe o melhor pro cliente e confirma. Tudo automático.", screen: 2 },
  ];

  return (
    <div className="bg-background overflow-x-hidden relative" style={{ fontFamily: "Sora, system-ui, sans-serif" }}>
      {/* FIXED GLOBAL BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-success/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(220,78%,48%,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(152,55%,42%,0.06),transparent_60%)]" />
        <div className="orb orb-1 absolute w-[200px] h-[200px] md:w-[300px] md:h-[300px] rounded-full"
             style={{top:"5%",left:"5%",background:"radial-gradient(circle at 40% 40%,hsl(220,78%,65%,0.35),hsl(220,78%,48%,0.08) 60%,transparent 70%)"}} />
        <div className="orb orb-2 absolute w-[180px] h-[180px] md:w-[260px] md:h-[260px] rounded-full"
             style={{bottom:"5%",right:"8%",background:"radial-gradient(circle at 60% 40%,hsl(152,55%,65%,0.3),hsl(152,55%,42%,0.08) 60%,transparent 70%)"}} />
        <div className="orb orb-3 absolute w-[150px] h-[150px] md:w-[220px] md:h-[220px] rounded-full"
             style={{top:"35%",right:"30%",background:"radial-gradient(circle at 50% 30%,hsl(215,60%,75%,0.25),hsl(215,50%,60%,0.06) 60%,transparent 70%)"}} />
      </div>

      <style>{`
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}

        @keyframes orb-float-1 {
          0%,100%{transform:translate(0,0)}
          25%{transform:translate(25px,-20px)}
          50%{transform:translate(-15px,-35px)}
          75%{transform:translate(20px,-10px)}
        }
        @keyframes orb-float-2 {
          0%,100%{transform:translate(0,0)}
          25%{transform:translate(-20px,-15px)}
          50%{transform:translate(30px,-25px)}
          75%{transform:translate(-10px,-20px)}
        }
        @keyframes orb-float-3 {
          0%,100%{transform:translate(0,0)}
          25%{transform:translate(15px,-25px)}
          50%{transform:translate(-25px,-15px)}
          75%{transform:translate(20px,-25px)}
        }

        .orb-1{animation:orb-float-1 6s ease-in-out infinite}
        .orb-2{animation:orb-float-2 8s ease-in-out infinite}
        .orb-3{animation:orb-float-3 7s ease-in-out infinite}

        .bubble-fixed {
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 50;
          will-change: transform, opacity;
          transition: none;
        }
        .wa {
          background: #fff;
          border-radius: 7px;
          padding: 6px 9px 7px 9px;
          box-shadow: 0 1px 0.5px rgba(0,0,0,0.12);
          position: relative;
          width: max-content;
          max-width: var(--bw, 260px);
        }
        .wa::before {
          content: "";
          position: absolute;
          top: 0;
          left: -5px;
          width: 0;
          height: 0;
          border: 5px solid transparent;
          border-left: 0;
          border-bottom: 0;
          border-right: 5px solid #fff;
          border-top: 5px solid #fff;
        }
        .wa-name {
          font-size: 12.8px;
          font-weight: 600;
          color: #128C7E;
          letter-spacing: -0.01em;
        }
        .wa-text {
          font-size: 14.2px;
          color: #111;
          line-height: 1.4;
          word-break: break-word;
        }
        .wa-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 2px;
          margin-top: 3px;
        }
        .wa-time {
          font-size: 11px;
          color: #667781;
        }
        .wa-check {
          width: 15px;
          height: 10px;
          color: #53bdeb;
        }

        .agenda-item {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .agenda-item.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .agenda-item:nth-child(1) { transition-delay: 0.03s; }
        .agenda-item:nth-child(2) { transition-delay: 0.08s; }
        .agenda-item:nth-child(3) { transition-delay: 0; }
        .agenda-item:nth-child(4) { transition-delay: 0; }

        .agenda-header-in {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s;
        }
        .agenda-header-in.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-[60] bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="mx-auto max-w-6xl px-4 h-11 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold text-sm tracking-tight text-foreground/85">Atendente</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground/85 transition-colors">Como funciona</a>
            <a href="#ferramentas" className="hover:text-foreground/85 transition-colors">Ferramentas</a>
            <a href="#precos" className="hover:text-foreground/85 transition-colors">Preços</a>
            <div className="flex items-center gap-2">
              <a href="/auth"><Button size="sm" variant="outline" className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent text-xs rounded-full px-4 h-8">Entrar</Button></a>
              <a href="/auth"><Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs rounded-full px-5 h-8">Criar conta</Button></a>
            </div>
          </nav>
          <button className="md:hidden p-1" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 px-4 py-4 space-y-3 bg-background">
            <a href="#como-funciona" className="block text-sm" onClick={() => setMobileOpen(false)}>Como funciona</a>
            <a href="#ferramentas" className="block text-sm" onClick={() => setMobileOpen(false)}>Ferramentas</a>
            <a href="#precos" className="block text-sm" onClick={() => setMobileOpen(false)}>Preços</a>
            <a href="/auth" onClick={() => setMobileOpen(false)}><Button size="sm" variant="outline" className="w-full border-border/60 text-muted-foreground">Entrar</Button></a>
            <a href="/auth" onClick={() => setMobileOpen(false)}><Button size="sm" className="w-full bg-foreground text-background">Criar conta</Button></a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section ref={heroRef} className="relative pt-11 min-h-[85vh] md:min-h-screen overflow-hidden">

        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-muted-foreground/40">
          <span className="text-xs font-medium tracking-widest uppercase">Role para ver 👇</span>
          <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Floating bubbles */}
      <div className="hidden md:block">
        {messages.map((msg, i) => {
          const color = avatarColors[i % avatarColors.length];
          return (
            <div
              key={msg.id}
              ref={(el) => { bubbleRefs.current[i] = el; }}
              className="bubble-fixed"
            >
              <div               className="wa" style={{ '--bw': `${baseWidths[i]}px` } as React.CSSProperties}>
                <div className="flex items-center gap-2 mb-0.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[8px] font-bold text-white"
                    style={{ background: color }}
                  >
                    {avatarLetters[i]}
                  </div>
                  <span className="wa-name">{msg.name}</span>
                </div>
                <div className="wa-text">{msg.text}</div>
                <div className="wa-footer">
                  <span className="wa-time">{msg.time}</span>
                  <svg className="wa-check" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.5 1.5L9.5 3.5L5.5 5" />
                    <path d="M8.5 4.5L5.5 6.5L1.5 8" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AGENDA */}
      <div ref={agendaRef}>
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 relative">
            <div className={`text-center mb-12 md:mb-16`}>
              <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4" style={{ opacity: 0 }}>
                <CalendarDays className="w-4 h-4" />
                Agenda inteligente
              </div>
              <h2 className="text-[32px] md:text-[44px] font-black text-foreground mb-3" style={{ textWrap: "balance" }}>
                <span ref={(el) => { wordRefs.current[0] = el; }} className="inline-block" style={{ opacity: 0 }}>Bagunça</span>
                <span> </span>
                <span ref={(el) => { wordRefs.current[1] = el; }} className="inline-block" style={{ opacity: 0 }}>vira</span>
                <span> </span>
                <span ref={(el) => { wordRefs.current[2] = el; }} className="inline-block" style={{ opacity: 0 }}>semana</span>
                <span> </span>
                <span ref={(el) => { wordRefs.current[3] = el; }} className="inline-block text-primary" style={{ opacity: 0 }}>organizada</span>
              </h2>
              <p ref={subtitleRef} className="text-lg text-muted-foreground max-w-xl mx-auto" style={{ opacity: 0 }}>
                24 mensagens. Uma semana. Zero estresse. ✨
              </p>
            </div>

            <div className={`agenda-header-in ${progress > 0.6 ? "visible" : ""}`}>
              <div className="overflow-x-auto pb-4 -mx-4 px-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0 scrollbar-none">
                <div className="grid grid-cols-5 gap-2 md:gap-3 min-w-[540px] md:min-w-0">
                  {days.map((day) => (
                    <div key={day.key} className="min-h-[200px] md:min-h-[240px]">
                      <div className="text-center mb-2 md:mb-3">
                        <div className="text-[11px] md:text-sm font-bold text-foreground/90">{day.label}</div>
                        <div className="text-[10px] md:text-xs text-muted-foreground/60 hidden md:block">{day.full}</div>
                      </div>
                      <div className="space-y-1.5 md:space-y-2">
                        {messages
                          .filter((m) => m.day === day.key)
                          .map((msg) => {
                            const idx = messages.indexOf(msg);
                            return (
                              <div
                                key={msg.id}
                                ref={(el) => { slotRefs.current[idx] = el; }}
                                className={`agenda-item group rounded-xl p-2.5 md:p-3 border border-border/70 bg-card hover:shadow-card transition-shadow cursor-default ${progress > 0.7 ? "visible" : ""}`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] md:text-xs font-bold text-white shadow-sm"
                                    style={{ background: avatarColors[idx % avatarColors.length] }}
                                  >
                                    {avatarLetters[idx]}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[11px] md:text-xs font-semibold text-foreground truncate">{msg.name}</span>
                                      <span className="text-[9px] md:text-[10px] text-muted-foreground/60 shrink-0 flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5" />
                                        {msg.time}
                                      </span>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-muted-foreground/80 leading-snug line-clamp-1 mt-0.5">{msg.service}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        {messages.filter((m) => m.day === day.key).length === 0 && (
                          <div className="h-10 md:h-12 rounded-xl border border-dashed border-border/40 bg-background/40 flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground/30">Disponível</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* COMO FUNCIONA */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-[32px] md:text-[44px] font-black text-foreground mb-4" style={{ textWrap: "balance" }}>
              Em três passos. Sem complicação. 👇
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              O cliente não precisa baixar app, criar conta, nem aprender nada. É só mandar um zap. 📲
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-8 md:gap-12 items-center">
            <div className="md:col-span-2 flex justify-center order-last md:order-first">
              <PhoneMockup screenIndex={activeStep} />
            </div>
            <div className="md:col-span-3 space-y-6">
              {steps.map((step, idx) => (
                <button key={step.num} onClick={() => setActiveStep(idx)} className="w-full text-left group cursor-pointer">
                  <div className={`p-5 rounded-2xl transition-all duration-300 ${
                    activeStep === idx
                      ? "bg-card shadow-card border border-border"
                      : "hover:bg-card/60"
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold transition-all duration-300 ${
                        activeStep === idx
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/10 text-muted-foreground"
                      }`}>
                        {step.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-bold mb-1 transition-colors ${activeStep === idx ? "text-foreground" : "text-foreground/70"}`}>
                          {step.title}
                        </h3>
                        <p className={`text-sm leading-relaxed transition-colors ${activeStep === idx ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                          {step.desc}
                        </p>
                      </div>
                      <ArrowRight className={`w-5 h-5 mt-1.5 shrink-0 transition-all duration-300 ${
                        activeStep === idx ? "text-primary opacity-100 translate-x-0" : "text-muted-foreground/30 opacity-0 -translate-x-2"
                      }`} />
                    </div>
                  </div>
                  {idx < steps.length - 1 && <div className="ml-[1.625rem] w-px h-4 bg-border mx-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-[32px] md:text-[44px] font-black text-foreground mb-4" style={{ textWrap: "balance" }}>
              Tudo que precisa. 🛠️
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Funciona sozinho. E se você já usa o ecossistema, fica ainda melhor.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { i: MessageCircle, t: "WhatsApp nativo 😊", d: "Conecta direto na Evolution API. O cliente manda zap, a IA responde. Sem intermediário.", c: "from-primary to-primary/80" },
              { i: Bot, t: "Entendimento contextual 🤔", d: "Não é robô com respostas prontas. A IA entende o que o cliente precisa, extrai dados e decide o próximo passo.", c: "from-[#AC39FF] to-[#9333EA]" },
              { i: CalendarDays, t: "Auto-agendamento 😎", d: "Consulta sua agenda em tempo real e sugere o melhor horário. Se for cliente do Controle Total, integra direto.", c: "from-[#30D158] to-[#28B84B]" },
              { i: Users, t: "Histórico completo", d: "Cada conversa fica salva com busca. Você acompanha o que a IA fez e pode intervir quando quiser.", c: "from-[#FF9F0A] to-[#E88F00]" },
              { i: Smartphone, t: "Painel de conversas 👀", d: "Veja em tempo real o que a IA está respondendo. Entre na conversa com um clique.", c: "from-[#FF375F] to-[#E83056]" },
              { i: BarChart3, t: "Relatórios 🤓", d: "Quantos clientes foram atendidos, quantos agendaram, quantos voltaram. Dados que te ajudam a crescer.", c: "from-[#5E5CE6] to-[#4B49D6]" },
            ].map((feat) => (
              <div key={feat.t} className="group relative rounded-2xl p-6 md:p-7 border border-border/80 bg-background hover:shadow-card transition-all duration-300 hover:-translate-y-0.5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.c} flex items-center justify-center mb-4 shadow-sm`}>
                  <feat.i className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[17px] font-bold text-foreground mb-1.5">{feat.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Conversa natural, não robô ✨
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-[28px] md:text-[36px] font-black text-foreground mb-4" style={{ textWrap: "balance" }}>
              Sozinho já resolve. Com o Controle Total, amplia. 🚀
            </h2>
            <p className="text-[17px] text-muted-foreground max-w-xl mx-auto">
              O Atendente funciona completo por conta própria. Se você também usa o Controle Total, agenda, clientes e orçamentos ficam integrados. 🔗
            </p>
          </div>
          <div className="bg-card rounded-2xl p-8 md:p-10 border border-border/80 text-center">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {[
                { i: CalendarDays, l: "Agenda e visitas" },
                { i: Users, l: "Clientes e histórico" },
                { i: ArrowRight, l: "Linha do tempo" },
                { i: BarChart3, l: "Relatórios" },
              ].map((item) => (
                <div key={item.l} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <item.i className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary to-success/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(0,0%,100%,0.1),transparent_60%)]" />
        <div className="mx-auto max-w-2xl px-4 text-center relative">
          <h2 className="text-[32px] md:text-[44px] font-black text-white mb-4" style={{ textWrap: "balance" }}>
            Testa por 30 dias.<br />Vai por mim... 😉
          </h2>
          <p className="text-lg text-white/80 mb-8">Sem cartão. Sem compromisso. A IA já começa a atender hoje. 🤖</p>
          <Button className="bg-white text-primary hover:bg-white/90 rounded-full px-8 h-[48px] text-[15px] font-bold cursor-pointer hover:scale-[1.03]">
            Criar conta grátis <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-border/50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 group">
              <div className="transition-transform duration-200 group-hover:scale-105"><Logo /></div>
              <span className="font-semibold text-sm text-foreground">
                Atendente
                <span className="ml-1.5 text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full align-middle">Beta</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors cursor-pointer">Termos de Uso</a>
              <a href="#" className="hover:text-foreground transition-colors cursor-pointer">Privacidade</a>
              <a href="mailto:contato@atendente.app" className="hover:text-foreground transition-colors cursor-pointer">Contato</a>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/60">&copy; 2026 Atendente — Um produto do ecossistema Controle Total 💙</p>
        </div>
      </footer>
    </div>
  );
}

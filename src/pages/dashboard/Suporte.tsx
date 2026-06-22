import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  Mail,
  MessageCircle,
  ExternalLink,
  Calendar,
  Users,
  Smartphone,
  Settings,
  LifeBuoy,
  BookOpen,
  Zap,
  Search,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

const SUPPORT_EMAIL = "contato@controletotal.app";
const SUPPORT_WHATSAPP = ""; // preencher quando disponível

type Modulo = {
  icon: typeof Calendar;
  title: string;
  href: string;
  desc: string;
  bullets: string[];
};

const modulos: Modulo[] = [
  {
    icon: Smartphone,
    title: "Conexão WhatsApp",
    href: "/configuracoes",
    desc: "Vincule o seu número comercial da empresa para a IA realizar os atendimentos.",
    bullets: [
      "Leitura rápida do QR Code gerado em segundos.",
      "Monitoramento do status de conexão (Conectado, Conectando, Desconectado).",
      "Isolamento ativo de mensagens de grupos e chats pessoais.",
    ],
  },
  {
    icon: Sparkles,
    title: "IA Recepcionista",
    href: "/configuracoes",
    desc: "Configure o nome e os comportamentos da recepcionista virtual inteligente.",
    bullets: [
      "Defina um nome amigável para a sua assistente (ex. Júlia, Carol).",
      "IA atua extraindo nome do cliente, serviço solicitado e endereço.",
      "Adaptação automática ao seu ramo de atividade profissional.",
    ],
  },
  {
    icon: Calendar,
    title: "Agenda e Horários",
    href: "/agenda",
    desc: "Painel completo dos horários e compromissos marcados de forma autônoma pela IA.",
    bullets: [
      "Visualização interativa de compromissos por dia e hora.",
      "Sincronização opcional com Google Calendar e outros serviços externos.",
      "Controle total de status: pendente, confirmado, concluído ou cancelado.",
    ],
  },
  {
    icon: MessageCircle,
    title: "Conversas e Chats",
    href: "/conversas",
    desc: "Histórico completo dos atendimentos em tempo real no WhatsApp.",
    bullets: [
      "Leitura do chat completo do cliente com as respostas dadas pela IA.",
      "Monitoramento e fila de mensagens em processamento pelo Gemini.",
      "Total controle das mensagens transacionais e de agendamento.",
    ],
  },
];

const faqs = [
  {
    categoria: "WhatsApp e Conexão",
    q: "Como conectar o meu WhatsApp comercial no Atendente?",
    a: "Para conectar o seu WhatsApp, acesse **Configurações** e sob o painel **WhatsApp** clique em **Conectar WhatsApp**. Um QR Code seguro será gerado na tela. Abra o WhatsApp no seu aparelho celular comercial, vá em *Configurações > Aparelhos Conectados > Conectar um aparelho* e aponte para a tela para ler o QR Code. O status mudará automaticamente para **Conectado**.",
  },
  {
    categoria: "Recepcionista IA",
    q: "A IA responde mensagens pessoais ou grupos no meu WhatsApp?",
    a: "Não! Por motivos de privacidade e conformidade com a LGPD, a inteligência artificial do Atendente **ignora ativamente** todas as mensagens recebidas em chats de grupos ou conversas de contatos pessoais iniciadas por você. Ela atua estritamente nas mensagens recebidas de novos clientes que iniciam contato com seu número comercial.",
  },
  {
    categoria: "WhatsApp e Conexão",
    q: "O que fazer se a conexão com o WhatsApp cair?",
    a: "Se o status for exibido como *Desconectado*, vá em **Configurações**, clique em **Reconectar** para gerar um novo QR Code e faça a leitura novamente com o seu celular. Isso pode ocorrer caso o aparelho fique muito tempo sem internet ou se a sessão for desconectada pelo próprio celular.",
  },
  {
    categoria: "WhatsApp e Conexão",
    q: "Posso usar o WhatsApp Web enquanto o Atendente está conectado?",
    a: "Sim, você pode utilizar o WhatsApp Web normalmente em seu computador ou o aplicativo do WhatsApp no celular. A conexão do Atendente funciona de forma integrada como um aparelho conectado adicional (multi-dispositivo), então as mensagens continuarão sendo enviadas e recebidas em todos os locais simultaneamente.",
  },
  {
    categoria: "WhatsApp e Conexão",
    q: "O Atendente funciona com contas do WhatsApp Business?",
    a: "Sim, o Atendente é totalmente compatível tanto com contas de WhatsApp comum quanto com contas do WhatsApp Business. Recomendamos o uso de contas Business para uma aparência mais profissional perante os seus clientes.",
  },
  {
    categoria: "Recepcionista IA",
    q: "Como alterar o nome da minha assistente virtual?",
    a: "Você pode atualizar o nome da IA a qualquer momento. Vá em **Configurações**, localize o painel **Perfil** (ou dados de Onboarding) e edite o campo **Nome da Assistente IA**. Salve as alterações e a IA se apresentará com o novo nome nas próximas interações com seus clientes.",
  },
  {
    categoria: "Recepcionista IA",
    q: "Como treinar ou personalizar as respostas que a minha assistente IA envia?",
    a: "A assistente IA utiliza as informações cadastradas de sua empresa (como ramo de atividade, serviços oferecidos, horários de atendimento e regras de agendamento) para formular as respostas. Quanto mais detalhadas estiverem as informações da sua empresa nas configurações do ecossistema, mais precisas e naturais serão as respostas dela.",
  },
  {
    categoria: "Recepcionista IA",
    q: "A assistente IA pode falar outros idiomas além do português?",
    a: "Sim! A assistente IA identifica automaticamente o idioma em que o cliente iniciou o contato (seja português, inglês, espanhol ou outro) e responde no mesmo idioma de maneira fluida e natural.",
  },
  {
    categoria: "Agendamentos",
    q: "Como a IA sabe quais horários e serviços sugerir para o cliente?",
    a: "A IA lê a configuração dos seus serviços (valores e durações) e sua escala de funcionamento cadastrada no ecossistema Controle Total. Ao conversar com o cliente, ela identifica o serviço desejado, busca na sua agenda os horários disponíveis e sugere as melhores opções de forma natural pelo chat.",
  },
  {
    categoria: "Agendamentos",
    q: "O que acontece quando um cliente solicita um horário que já está ocupado na minha agenda?",
    a: "Se o horário solicitado estiver reservado na sua agenda (ou se conflitar com o seu horário de funcionamento), a IA detectará o conflito instantaneamente. Ela então sugerirá de forma proativa as próximas datas e horários livres mais próximos da preferência do cliente, garantindo que você nunca tenha agendamentos duplicados.",
  },
  {
    categoria: "Agendamentos",
    q: "Os clientes podem cancelar ou reagendar compromissos diretamente pelo WhatsApp?",
    a: "Sim! Se um cliente mandar mensagem pedindo para cancelar ou mudar o horário de uma visita/serviço, a IA consultará o compromisso existente, efetuará o cancelamento ou buscará um novo horário disponível na sua agenda para reagendar, confirmando a alteração na conversa.",
  },
  {
    categoria: "Clientes e Conversas",
    q: "Consigo ver o histórico das conversas que a IA teve com os clientes?",
    a: "Sim! No menu **Conversas**, você tem acesso à listagem completa de chats ativos. Ao clicar em uma conversa, você visualiza em tempo real a transcrição de todas as mensagens enviadas pelo cliente e as respostas automáticas dadas pela sua recepcionista IA.",
  },
  {
    categoria: "Clientes e Conversas",
    q: "Posso assumir a conversa no WhatsApp manualmente se a IA não entender o cliente?",
    a: "Com certeza! No menu **Conversas**, ao selecionar um chat, você pode clicar no botão **Pausar IA** no cabeçalho ou simplesmente digitar e enviar uma mensagem manual. O sistema detectará o envio manual e silenciará a IA automaticamente para este contato (mudando para o modo *Suporte Manual*), permitindo que você prossiga a conversa sem que a assistente tente responder. Você pode reativar a IA a qualquer momento clicando em **Ativar IA**.",
  },
  {
    categoria: "Agendamentos",
    q: "O que é o Pipeline CRM (Funil de Leads) no Dashboard?",
    a: "Para usuários exclusivos do Atendente, a tela inicial exibe um **Pipeline CRM (Kanban)**. Ele organiza automaticamente os orçamentos e contatos qualificados pela IA em quatro colunas: *Leads Qualificados*, *Em Negociação*, *Aprovados*, e *Recusados*. Você pode arrastar ou clicar nos botões de ação para mover o status das propostas de forma visual conforme a negociação avança.",
  },
  {
    categoria: "Clientes e Conversas",
    q: "Como funciona o pós-venda automático de 24 horas?",
    a: "Sempre que um orçamento ou proposta comercial for marcado como **Aprovado** (seja no Controle Total ou no funil Kanban do Atendente), o sistema agenda uma mensagem de pós-venda. Após 24 horas da aprovação, a IA envia uma mensagem personalizada agradecendo a confiança e convidando o cliente a avaliar a empresa no Google através de um link configurado no sistema.",
  },
  {
    categoria: "Configurações e Conta",
    q: "Como atualizar o telefone, ramo ou endereço comercial da minha empresa?",
    a: "Todas as informações preenchidas durante o onboarding inicial podem ser visualizadas e editadas no menu **Configurações** na seção **Informações Cadastrais (Onboarding)**. Basta ajustar os campos (nome fantasia, telefone comercial, cidade, UF, ramo de atividade) e clicar em **Salvar Alterações**.",
  },
  {
    categoria: "Configurações e Conta",
    q: "Como funciona a cobrança da assinatura do Atendente?",
    a: "A assinatura do Atendente é recorrente (mensal ou anual) e cobrada de forma integrada ao ecossistema do Controle Total. Você pode gerenciar os planos contratados e visualizar os dados de faturamento diretamente na seção de Assinatura nas configurações da plataforma.",
  },
  {
    categoria: "Configurações e Conta",
    q: "Os dados e conversas com meus clientes são seguros e protegidos pela LGPD?",
    a: "Absolutamente. O Atendente está em conformidade com as diretrizes da LGPD. Todas as conversas são processadas temporariamente em memória para gerar as respostas inteligentes, sem armazenamento definitivo de dados sensíveis ou mídias em nossos servidores, garantindo privacidade completa para você e seus clientes.",
  }
];

// Helper to render bold/italic text
const parseInlineStyles = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic text-foreground/80">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

const FAQContentRenderer = ({ text }: { text: string }) => {
  const paragraphs = text.split("\n\n");

  return (
    <div className="space-y-4 text-foreground/90 leading-relaxed text-sm md:text-[15px]">
      {paragraphs.map((para, pIdx) => {
        if (para.startsWith("*Nota:") || para.toLowerCase().startsWith("nota:")) {
          const cleanText = para.replace(/^\*?Nota:\s*/i, "").replace(/\*$/, "");
          return (
            <div
              key={pIdx}
              className="flex gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-primary/90 mt-2 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5 text-primary">Nota Importante</span>
                <span className="text-foreground/85">{parseInlineStyles(cleanText)}</span>
              </div>
            </div>
          );
        }

        const lines = para.split("\n");
        const hasSteps = lines.some((line) => /^\d+\.\s/.test(line));
        const hasBullets = lines.some((line) => /^\s*[-*]\s/.test(line));

        if (hasSteps) {
          return (
            <div key={pIdx} className="space-y-3.5 my-3 bg-card/10 p-2 rounded-lg">
              {lines.map((line, lineIdx) => {
                const match = line.match(/^(\d+)\.\s(.*)$/);
                if (match) {
                  const [, num, content] = match;
                  return (
                    <div key={lineIdx} className="flex gap-4 items-start pl-1">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-primary/20">
                        {num}
                      </span>
                      <span className="flex-1 pt-0.5 text-foreground/85">{parseInlineStyles(content)}</span>
                    </div>
                  );
                }
                return (
                  <p key={lineIdx} className="pl-10 text-foreground/85">
                    {parseInlineStyles(line)}
                  </p>
                );
              })}
            </div>
          );
        }

        if (hasBullets) {
          return (
            <div key={pIdx} className="space-y-2.5 my-3 pl-1">
              {lines.map((line, lineIdx) => {
                const match = line.match(/^\s*[-*]\s(.*)$/);
                if (match) {
                  const content = match[1];
                  return (
                    <div key={lineIdx} className="flex gap-3 items-start pl-4">
                      <ChevronRight className="w-4 h-4 text-primary/60 shrink-0 mt-1" />
                      <span className="flex-1 text-foreground/85">{parseInlineStyles(content)}</span>
                    </div>
                  );
                }
                return (
                  <p key={lineIdx} className="pl-8 text-foreground/85">
                    {parseInlineStyles(line)}
                  </p>
                );
              })}
            </div>
          );
        }

        return <p key={pIdx} className="text-foreground/85">{parseInlineStyles(para)}</p>;
      })}
    </div>
  );
};

export default function Suporte() {
  const [busca, setBusca] = useState("");

  const categorias = useMemo(() => {
    return [
      "WhatsApp e Conexão",
      "Recepcionista IA",
      "Agendamentos",
      "Clientes e Conversas",
      "Configurações e Conta"
    ];
  }, []);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState(categorias[0]);

  const modulosFiltrados = modulos.filter(
    (m) =>
      busca.length < 2 ||
      m.title.toLowerCase().includes(busca.toLowerCase()) ||
      m.desc.toLowerCase().includes(busca.toLowerCase()) ||
      m.bullets.some((b) => b.toLowerCase().includes(busca.toLowerCase()))
  );

  const faqsFiltradas = useMemo(() => {
    return faqs.filter((f) => {
      const matchesSearch =
        busca.length < 2 ||
        f.q.toLowerCase().includes(busca.toLowerCase()) ||
        f.a.toLowerCase().includes(busca.toLowerCase()) ||
        f.categoria.toLowerCase().includes(busca.toLowerCase());

      if (busca.length >= 2) {
        return matchesSearch;
      }
      return matchesSearch && f.categoria === categoriaSelecionada;
    });
  }, [busca, categoriaSelecionada]);

  const getCategoriaIcon = (cat: string) => {
    switch (cat) {
      case "WhatsApp e Conexão":
        return Smartphone;
      case "Recepcionista IA":
        return Sparkles;
      case "Agendamentos":
        return Calendar;
      case "Clientes e Conversas":
        return MessageCircle;
      case "Configurações e Conta":
        return Settings;
      default:
        return HelpCircle;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Central de Ajuda</h2>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            Encontre guias e respostas sobre a IA do Atendente
            <span className="text-[10px] font-bold text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">Beta</span>
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
          <Input
            placeholder="Pesquisar ajuda..."
            className="pl-10 pr-4 py-5 bg-card border-border/60 shadow-sm focus-visible:ring-primary rounded-xl"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Canais de suporte rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Mail className="w-4 h-4" />
              </div>
              Suporte por E-mail
            </CardTitle>
            <CardDescription>Ideal para dúvidas complexas e solicitações</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full justify-between hover:bg-primary/5 group border-border/60">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center justify-between w-full">
                <span className="font-mono text-sm">{SUPPORT_EMAIL}</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
                <MessageCircle className="w-4 h-4" />
              </div>
              WhatsApp Oficial
            </CardTitle>
            <CardDescription>{SUPPORT_WHATSAPP ? "Atendimento humanizado em horário comercial" : "Central de WhatsApp em implantação"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full justify-between border-border/60" disabled={!SUPPORT_WHATSAPP}>
              {SUPPORT_WHATSAPP ? (
                <a href={`https://api.whatsapp.com/send?phone=${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer" className="flex items-center justify-between w-full">
                  <span>Falar com atendente</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <span className="text-muted-foreground text-sm">Disponível em breve</span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Layout FAQ Categorizado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-3">
          <div className="px-2 pb-1 text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />
            Tópicos de Ajuda
          </div>
          
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-2 lg:pb-0 scrollbar-none">
            {categorias.map((cat) => {
              const IconComponent = getCategoriaIcon(cat);
              const isActive = categoriaSelecionada === cat && busca.length < 2;
              const count = faqs.filter(f => f.categoria === cat).length;
              
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoriaSelecionada(cat);
                    setBusca("");
                  }}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 w-auto lg:w-full border focus:outline-none focus:ring-0 focus-visible:outline-none select-none ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 scale-[1.01]"
                      : "bg-card hover:bg-accent/40 text-foreground/70 hover:text-foreground border-border/40"
                  }`}
                >
                  <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-primary/70"}`} />
                  <span className="flex-1 truncate">{cat}</span>
                  <Badge 
                    variant={isActive ? "outline" : "secondary"} 
                    className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${isActive ? "border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10" : ""}`}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {busca.length >= 2 ? (
                <>
                  <span>Resultados para "{busca}"</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none">{faqsFiltradas.length}</Badge>
                </>
              ) : (
                <>
                  <span>{categoriaSelecionada}</span>
                </>
              )}
            </h2>
          </div>

          {faqsFiltradas.length === 0 ? (
            <Card className="border border-dashed border-border/80 p-8 text-center bg-card/20 rounded-2xl">
              <HelpCircle className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-semibold text-lg">Nenhuma pergunta encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tente pesquisar termos diferentes ou navegue pelos tópicos ao lado.
              </p>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqsFiltradas.map((f, i) => (
                <AccordionItem
                  key={`${f.q}-${i}`}
                  value={`faq-${i}`}
                  className="border border-border/40 rounded-xl overflow-hidden bg-card/30 hover:bg-card/70 hover:border-primary/20 transition-all duration-300 shadow-sm"
                >
                  <AccordionTrigger className="text-left text-base font-semibold py-4.5 px-5 hover:no-underline hover:text-primary transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none [&[data-state=open]]:bg-primary/[0.02] [&[data-state=open]]:text-primary select-none border-none">
                    <span className="flex items-center gap-3 pr-4">
                      <span className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                      {f.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm md:text-[15px] text-foreground/85 whitespace-pre-wrap leading-relaxed pb-6 pt-3 px-6 border-t border-border/30 bg-card/10">
                    <FAQContentRenderer text={f.a} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>

      {/* Guia Rápido de Módulos */}
      <Card className="border border-border/40 shadow-sm bg-card/30 rounded-2xl overflow-hidden mt-10">
        <CardHeader className="border-b border-border/20 bg-card/20 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <BookOpen className="w-5 h-5 text-primary" />
            Recursos da Plataforma
          </CardTitle>
          <CardDescription>Como funcionam as principais seções do Atendente</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modulosFiltrados.map((m) => (
              <div key={m.title} className="p-5 rounded-2xl border border-border/40 bg-card/50 hover:bg-accent/20 transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <m.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-1">{m.title}</h3>
                  <p className="text-xs text-foreground/75 leading-relaxed mb-4">{m.desc}</p>
                  <ul className="space-y-2 mb-4">
                    {m.bullets.map((b, i) => (
                      <li key={i} className="text-[11px] text-foreground/75 flex gap-2 items-start leading-snug">
                        <span className="text-primary font-bold text-xs shrink-0">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button asChild variant="ghost" size="sm" className="w-full text-xs font-semibold justify-between mt-auto hover:bg-primary/5 text-primary">
                  <Link to={m.href} className="flex items-center justify-between w-full">
                    <span>Acessar {m.title}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

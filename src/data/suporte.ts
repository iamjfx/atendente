import {
  Calendar, MessageCircle, Settings, Smartphone, Sparkles,
  HelpCircle,
} from "lucide-react";

export const SUPPORT_EMAIL = "contato@controletotal.app";
export const SUPPORT_WHATSAPP = "";

export type Modulo = {
  icon: typeof Calendar;
  title: string;
  href: string;
  desc: string;
  bullets: string[];
};

export const modulos: Modulo[] = [
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
    icon: Settings,
    title: "Serviços e Catálogo",
    href: "/configuracoes",
    desc: "Gerencie os serviços oferecidos e o tempo de deslocamento.",
    bullets: [
      "Cadastro simples de serviços com nome, duração e preço.",
      "Toggle para ativar/desativar serviços individualmente.",
      "Tempo de deslocamento considerado nos agendamentos.",
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

export const categorias = [
  "WhatsApp e Conexão",
  "Recepcionista IA",
  "Agendamentos",
  "Clientes e Conversas",
  "Configurações e Conta",
];

export const faqs = [
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
    categoria: "Clientes e Conversas",
    q: "Como funciona o pós-venda automático de 24 horas?",
    a: "Sempre que um orçamento ou proposta comercial for marcado como **Aprovado** no Controle Total, o sistema agenda uma mensagem de pós-venda. Após 24 horas da aprovação, a IA envia uma mensagem personalizada agradecendo a confiança e convidando o cliente a avaliar a empresa no Google através de um link configurado no sistema.",
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
  },
  {
    categoria: "Configurações e Conta",
    q: "Como cadastrar os serviços que minha empresa oferece?",
    a: "Vá em **Configurações > Serviços**. Clique em **Adicionar Serviço** e preencha o nome, a duração aproximada (em minutos) e o preço (opcional). A IA usará essa lista automaticamente para sugerir agendamentos aos clientes. Os serviços podem ser ativados/desativados individualmente com o toggle ao lado de cada um.",
  },
  {
    categoria: "Agendamentos",
    q: "A IA considera o tempo de deslocamento até o cliente ao sugerir horários?",
    a: "Sim! Em **Configurações > Comportamento da IA**, você define o **Tempo de Deslocamento (minutos)** — o tempo médio que o profissional leva para chegar até o cliente. A IA considera esse tempo ao sugerir horários de visita. Quando um agendamento é criado, a notificação enviada para você inclui o deslocamento e a previsão de saída do profissional.",
  },
  {
    categoria: "Agendamentos",
    q: "Como a IA calcula a duração do agendamento?",
    a: "A IA usa a **duração** cadastrada no catálogo de serviços (em **Configurações > Serviços**). Se um serviço tem duração de 90 minutos, o horário final do agendamento será calculado como hora_inicio + 90min. Antes os agendamentos tinham duração fixa de 1h — agora a duração é dinâmica de acordo com cada serviço.",
  },
  {
    categoria: "Configurações e Conta",
    q: "Como configurar os horários de funcionamento da minha empresa?",
    a: "Vá em **Configurações > Horários de Funcionamento**. Você pode ativar/desativar cada dia da semana e definir os horários de abertura e fechamento. A IA usa essas informações para saber quando sugerir agendamentos aos clientes.",
  },
];

export function getCategoriaIcon(cat: string) {
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
}

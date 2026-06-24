# Product

## Register

brand

## Users

Prestadores de serviço autônomos (eletricistas, encanadores, pintores, pedreiros) e pequenos negócios de serviço que usam WhatsApp para atender clientes. Estão no celular o dia todo, não tem secretária, e perdem mensagens ou demoram pra responder. Querem parecer profissionais sem contratar alguém.

## Product Purpose

O Atendente é uma recepcionista de IA que atende, tria e agenda clientes automaticamente pelo WhatsApp. Enquanto o prestador trabalha, a IA responde, extrai nome/endereço/problema, e sugere horários. Existe pra resolver o caos de mensagens perdidas e clientes sem resposta.

## Core Features

- **Atendimento via IA**: Responde clientes no WhatsApp 24h usando Google Gemini, com fallback automático entre modelos (2.5 Flash → 2.5 Flash Lite → Flash Latest) quando há pico de demanda.
- **Catálogo de Serviços Lite**: Cadastro simples de serviços com nome, duração e preço — o suficiente pra IA saber o que oferecer, sem canibalizar o Controle Total.
- **Agendamento Automático**: IA coleta dados, sugere horários com base nos horários de funcionamento, e cria agendamentos na agenda com duração dinâmica e tempo de deslocamento.
- **Deslocamento**: Configuração do tempo médio de deslocamento do profissional. A IA considera isso ao sugerir horários, e a notificação ao dono inclui previsão de saída.
- **Horários de Funcionamento**: Configuração de dias e horários de atendimento (7 dias da semana, toggle + time picker).
- **Notificação ao Dono**: Quando a IA agenda uma visita, envia um WhatsApp pro telefone do dono com cliente, serviço, data, horário e deslocamento.
- **Painel Web**: Dashboard com métricas (conversas hoje, resolução IA, pendentes, status WhatsApp), agenda com visão dia/semana/mês, conversas em tempo real com toggle IA/manual.
- **Histórico Limpo**: Mensagens com frases proibidas ("alguém vai retornar", "recebi sua mensagem") são filtradas do histórico enviado ao Gemini e bloqueadas com dupla checagem de segurança.

## Brand Personality

Inovador, ousado, inteligente. Tom de vanguarda, que surpreende, tecnológico mas acessível. Confiante sem ser arrogante. Direto sem ser seco. Parece mágica, mas é só tecnologia bem feita.

## Anti-references

- SaaS cliché: purple-to-blue gradients, Inter font everywhere, cards nested in cards, rounded icon tiles above every heading
- "Crentech" ou "empreendedorismo digital" estética overpromise
- Tom de "você está perdendo dinheiro" — não é urgência fabricada
- Não parecer um bot — tem que parecer inteligente de verdade
- Não usar gray text on colored backgrounds

## Design Principles

1. **Parece mágica, mas é real.** A interface deve transmitir que a IA funciona de verdade. Mostrar o produto em ação, não prometer.
2. **Confiança sem exagero.** Tom de quem já resolveu o problema, não de quem está tentando vender. Sem urgência fabricada.
3. **Direto ao ponto.** O prestador de serviço não tem tempo. A mensagem tem que ser clara em segundos.
4. **Distinto, não template.** Não pode parecer "mais um SaaS". Tem que ter personalidade própria.

## Accessibility & Inclusion

- WCAG AA mínimo (contraste 4.5:1)
- prefers-reduced-motion suportado
- pt-BR throughout
- Fontes legíveis em mobile (tamanho mínimo 16px em inputs)

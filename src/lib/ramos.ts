export type RamoPerfil =
  | "obra"
  | "beleza"
  | "saude"
  | "educacao"
  | "eventos"
  | "pet"
  | "servico"
  | "generico";

export interface Ramo {
  id: string;
  label: string;
  categoria: string;
  perfil: RamoPerfil;
}

export const RAMOS: Ramo[] = [
  // Construção / Reformas
  { id: "pedreiro", label: "Pedreiro / Construção", categoria: "Obras e Reformas", perfil: "obra" },
  { id: "eletricista", label: "Eletricista", categoria: "Obras e Reformas", perfil: "obra" },
  { id: "encanador", label: "Encanador", categoria: "Obras e Reformas", perfil: "obra" },
  { id: "pintor", label: "Pintor", categoria: "Obras e Reformas", perfil: "obra" },
  { id: "marceneiro", label: "Marceneiro", categoria: "Obras e Reformas", perfil: "obra" },
  { id: "serralheiro", label: "Serralheiro", categoria: "Obras e Reformas", perfil: "obra" },

  // Serviços gerais
  { id: "diarista", label: "Diarista / Limpeza", categoria: "Serviços", perfil: "servico" },
  { id: "jardinagem", label: "Jardinagem / Paisagismo", categoria: "Serviços", perfil: "servico" },
  { id: "mecanico", label: "Mecânico", categoria: "Serviços", perfil: "servico" },
  { id: "tecnico_ti", label: "Técnico TI / Eletrônicos", categoria: "Serviços", perfil: "servico" },
  { id: "fotografo", label: "Fotógrafo / Videomaker", categoria: "Serviços", perfil: "servico" },

  // Beleza
  { id: "estetica", label: "Clínica de Estética", categoria: "Beleza e Bem-estar", perfil: "beleza" },
  { id: "cabeleireiro", label: "Cabeleireiro / Barbeiro", categoria: "Beleza e Bem-estar", perfil: "beleza" },
  { id: "manicure", label: "Manicure / Pedicure", categoria: "Beleza e Bem-estar", perfil: "beleza" },
  { id: "massoterapia", label: "Massoterapia / SPA", categoria: "Beleza e Bem-estar", perfil: "beleza" },

  // Saúde
  { id: "personal", label: "Personal Trainer", categoria: "Saúde", perfil: "saude" },
  { id: "nutricionista", label: "Nutricionista", categoria: "Saúde", perfil: "saude" },
  { id: "psicologo", label: "Psicólogo / Terapeuta", categoria: "Saúde", perfil: "saude" },
  { id: "fisioterapeuta", label: "Fisioterapeuta", categoria: "Saúde", perfil: "saude" },
  { id: "acupunturista", label: "Acupunturista", categoria: "Saúde", perfil: "saude" },

  // Educação
  { id: "professor", label: "Professor Particular", categoria: "Educação", perfil: "educacao" },
  { id: "idiomas", label: "Escola de Idiomas", categoria: "Educação", perfil: "educacao" },

  // Criativo / Consultoria
  { id: "designer", label: "Designer / Marketing", categoria: "Criativo e Consultoria", perfil: "servico" },
  { id: "consultor", label: "Consultor", categoria: "Criativo e Consultoria", perfil: "servico" },

  // Eventos
  { id: "buffet", label: "Buffet / Eventos", categoria: "Eventos", perfil: "eventos" },
  { id: "musico", label: "Músico / DJ", categoria: "Eventos", perfil: "eventos" },

  // Pet
  { id: "petshop", label: "Pet Shop / Banho e Tosa", categoria: "Pet", perfil: "pet" },
  { id: "adestrador", label: "Adestrador", categoria: "Pet", perfil: "pet" },

  // Personalizada (disponível para todos)
  { id: "personalizada", label: "Personalizada (descreva sua atividade)", categoria: "Personalizada", perfil: "generico" },

  // Outro
  { id: "outro", label: "Outro (especificar)", categoria: "Outro", perfil: "generico" },
];

export interface UnidadeMedida {
  id: string;
  label: string;
  abrev: string;
}

export const UNIDADES_POR_PERFIL: Record<RamoPerfil, UnidadeMedida[]> = {
  obra: [
    { id: "m2", label: "Metro quadrado", abrev: "m²" },
    { id: "m3", label: "Metro cúbico", abrev: "m³" },
    { id: "ml", label: "Metro linear", abrev: "m" },
    { id: "saco", label: "Sacos", abrev: "saco" },
    { id: "kg", label: "Quilo", abrev: "kg" },
    { id: "diaria", label: "Diária", abrev: "diária" },
    { id: "empreitada", label: "Empreitada", abrev: "empreitada" },
    { id: "un", label: "Unidade", abrev: "un" },
  ],
  beleza: [
    { id: "sessao", label: "Sessão", abrev: "sessão" },
    { id: "pacote", label: "Pacote", abrev: "pacote" },
    { id: "avulso", label: "Avulso", abrev: "avulso" },
    { id: "mensalidade", label: "Mensalidade", abrev: "mês" },
  ],
  saude: [
    { id: "sessao", label: "Sessão", abrev: "sessão" },
    { id: "consulta", label: "Consulta", abrev: "consulta" },
    { id: "pacote", label: "Pacote", abrev: "pacote" },
    { id: "mensalidade", label: "Mensalidade", abrev: "mês" },
  ],
  educacao: [
    { id: "aula", label: "Aula", abrev: "aula" },
    { id: "pacote_aulas", label: "Pacote de aulas", abrev: "pacote" },
    { id: "hora", label: "Hora", abrev: "h" },
    { id: "mensalidade", label: "Mensalidade", abrev: "mês" },
  ],
  eventos: [
    { id: "evento", label: "Evento", abrev: "evento" },
    { id: "hora", label: "Hora", abrev: "h" },
    { id: "pacote", label: "Pacote", abrev: "pacote" },
    { id: "diaria", label: "Diária", abrev: "diária" },
  ],
  pet: [
    { id: "servico", label: "Serviço", abrev: "serviço" },
    { id: "pacote", label: "Pacote", abrev: "pacote" },
    { id: "mensalidade", label: "Mensalidade", abrev: "mês" },
  ],
  servico: [
    { id: "hora", label: "Hora", abrev: "h" },
    { id: "diaria", label: "Diária", abrev: "diária" },
    { id: "servico", label: "Serviço avulso", abrev: "serviço" },
    { id: "empreitada", label: "Empreitada", abrev: "empreitada" },
  ],
  generico: [
    { id: "un", label: "Unidade", abrev: "un" },
    { id: "hora", label: "Hora", abrev: "h" },
    { id: "servico", label: "Serviço", abrev: "serviço" },
  ],
};

export function getRamoById(id: string | null | undefined): Ramo | undefined {
  if (!id) return undefined;
  return RAMOS.find((r) => r.id === id);
}

export function getUnidadesPorRamo(ramoId: string | null | undefined): UnidadeMedida[] {
  const ramo = getRamoById(ramoId);
  return UNIDADES_POR_PERFIL[ramo?.perfil ?? "generico"];
}

/**
 * Exemplo de nome de serviço para cada ramo de atividade.
 * Usado como placeholder dinâmico no cadastro de serviços.
 */
export const EXEMPLO_SERVICO_POR_RAMO: Record<string, string> = {
  // Obras e Reformas
  pedreiro: "Instalar piso",
  eletricista: "Instalar tomada",
  encanador: "Desentupir pia",
  pintor: "Pintar parede",
  marceneiro: "Montar armário",
  serralheiro: "Soldar portão",
  // Serviços Gerais
  diarista: "Limpeza completa",
  jardinagem: "Cortar grama",
  mecanico: "Trocar óleo",
  tecnico_ti: "Formatar computador",
  fotografo: "Ensaio externo",
  // Beleza e Bem-estar
  estetica: "Limpeza de pele",
  cabeleireiro: "Corte masculino",
  manicure: "Esmaltação em gel",
  massoterapia: "Massagem relaxante",
  // Saúde
  personal: "Treino funcional",
  nutricionista: "Consulta inicial",
  psicologo: "Sessão individual",
  fisioterapeuta: "Sessão de reabilitação",
  acupunturista: "Sessão de acupuntura",
  // Educação
  professor: "Aula particular",
  idiomas: "Aula de inglês",
  // Criativo e Consultoria
  designer: "Criar arte para rede social",
  consultor: "Consultoria",
  // Eventos
  buffet: "Buffet para 50 pessoas",
  musico: "Show ao vivo",
  // Pet
  petshop: "Banho e tosa",
  adestrador: "Sessão de adestramento",
  // Genérico
  personalizada: "Serviço personalizado",
  outro: "Serviço",
};

export const TOTAL_ETAPAS = 5;

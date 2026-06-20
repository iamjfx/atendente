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

  // Outro
  { id: "outro", label: "Outro (especificar)", categoria: "Outro", perfil: "generico" },
];

export function getRamoById(id: string | null | undefined): Ramo | undefined {
  if (!id) return undefined;
  return RAMOS.find((r) => r.id === id);
}

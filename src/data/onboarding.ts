import { Hammer, Wrench, Sparkles, Heart, BookOpen, Palette, Music, PawPrint, Building2 } from "lucide-react";

export const CATEGORIA_ICONE: Record<string, { icon: any; cor: string; bg: string }> = {
  "Obras e Reformas": { icon: Hammer, cor: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
  "Serviços": { icon: Wrench, cor: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  "Beleza e Bem-estar": { icon: Sparkles, cor: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20" },
  "Saúde": { icon: Heart, cor: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
  "Educação": { icon: BookOpen, cor: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  "Criativo e Consultoria": { icon: Palette, cor: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20" },
  "Eventos": { icon: Music, cor: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  "Pet": { icon: PawPrint, cor: "text-teal-500", bg: "bg-teal-500/10 border-teal-500/20" },
  "Outro": { icon: Building2, cor: "text-slate-500", bg: "bg-slate-500/10 border-slate-500/20" },
};

export const stepsLabel = [
  { num: 1, label: "Sobre Você" },
  { num: 2, label: "Seu Negócio" },
  { num: 3, label: "Sua Assistente" },
  { num: 4, label: "Conexão" },
  { num: 5, label: "Segurança" },
];

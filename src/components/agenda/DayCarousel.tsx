import { useMemo } from "react";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

export default function DayCarousel({ selectedDate, onSelectDate }: Props) {
  const days = useMemo(() => {
    const today = new Date();
    const result = [];
    for (let i = -3; i <= 3; i++) {
      const d = addDays(today, i);
      result.push(d);
    }
    return result;
  }, []);

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
      <button onClick={() => onSelectDate(subDays(selectedDate, 1))} className="p-1 rounded hover:bg-accent shrink-0">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {days.map((day) => {
        const isSel = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
        const isHoje = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0 min-w-[52px]",
              isSel ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              isHoje && !isSel && "font-bold text-primary"
            )}
          >
            <span className="text-[10px] uppercase">{format(day, "EEE", { locale: ptBR }).slice(0, 3)}</span>
            <span className="text-sm font-semibold">{format(day, "d")}</span>
          </button>
        );
      })}
      <button onClick={() => onSelectDate(addDays(selectedDate, 1))} className="p-1 rounded hover:bg-accent shrink-0">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

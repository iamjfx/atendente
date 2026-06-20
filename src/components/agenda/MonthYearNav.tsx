import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  getDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/appointment";
import { statusColor } from "@/lib/statusHelpers";

interface Props {
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  appointments: Appointment[];
  onSelectDate: (d: Date) => void;
  selectedDate: Date;
}

export default function MonthYearNav({ currentMonth, setCurrentMonth }: { currentMonth: Date; setCurrentMonth: (d: Date) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-accent">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-semibold min-w-[140px] text-center">
        {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
      </span>
      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded hover:bg-accent">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export function MiniCalendar({ currentMonth, setCurrentMonth, appointments, onSelectDate, selectedDate }: Props) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const aptCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const apt of appointments) {
      map.set(apt.data, (map.get(apt.data) ?? 0) + 1);
    }
    return map;
  }, [appointments]);

  return (
    <div className="space-y-3">
      <MonthYearNav currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
      <div className="grid grid-cols-7 gap-0 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={i} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const count = aptCountByDay.get(key) ?? 0;
          const isSel = isSameDay(day, selectedDate);
          return (
            <button
              key={key}
              onClick={() => onSelectDate(day)}
              className={cn(
                "text-xs py-1 rounded relative hover:bg-accent transition-colors",
                !isSameMonth(day, currentMonth) && "text-muted-foreground/30",
                isSel && "bg-primary text-primary-foreground hover:bg-primary",
                isToday(day) && !isSel && "font-bold text-primary"
              )}
            >
              {format(day, "d")}
              {count > 0 && (
                <span className={cn(
                  "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
                  isSel ? "bg-white" : "bg-primary"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

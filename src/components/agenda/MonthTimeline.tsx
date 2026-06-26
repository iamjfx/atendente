import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, parse } from "date-fns";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/appointment";

interface Props {
  currentMonth: Date;
  appointments: Appointment[];
  onSelectDate: (d: Date) => void;
  onSelectAppointment: (apt: Appointment) => void;
}

export default function MonthTimeline({ currentMonth, appointments, onSelectDate, onSelectAppointment }: Props) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const aptsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of appointments) {
      const existing = map.get(apt.data) ?? [];
      existing.push(apt);
      map.set(apt.data, existing);
    }
    return map;
  }, [appointments]);

  return (
    <div className="overflow-auto h-[calc(100vh-280px)] lg:h-[calc(100vh-210px)]">
      <div className="grid grid-cols-7 border-b border-border sticky top-0 bg-background z-10">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="text-center py-2 text-[10px] font-medium text-muted-foreground uppercase">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayApts = aptsByDay.get(key) ?? [];
          const isSel = isSameDay(day, new Date());
          const isOutside = !isSameMonth(day, currentMonth);

          return (
            <div
              key={key}
              className={cn(
                "min-h-[100px] border-b border-r border-border/30 p-1 cursor-pointer hover:bg-accent/20 transition-colors",
                isOutside && "opacity-40"
              )}
              onClick={() => onSelectDate(day)}
            >
              <div className="flex items-center justify-center w-6 h-6 mb-1">
                <span className={cn(
                  "text-xs",
                  isToday(day) && "bg-primary text-primary-foreground font-bold w-6 h-6 rounded-full flex items-center justify-center",
                  !isToday(day) && "font-medium"
                )}>
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayApts.slice(0, 3).map((apt) => {
                  const phone = apt.telefone?.replace(/\D/g, "");
                  const url = phone ? `https://api.whatsapp.com/send?phone=55${phone}` : null;
                  return (
                    <div
                      key={apt.id}
                      onClick={(e) => { e.stopPropagation(); onSelectAppointment(apt); }}
                      className={cn(
                        "text-[10px] px-1 py-0.5 rounded truncate leading-tight group relative",
                        apt.status === "confirmed" && "bg-success/20 text-success",
                        apt.status === "pending" && "bg-yellow-500/20 text-yellow-700",
                        apt.status === "completed" && "bg-primary/20 text-primary",
                        apt.status === "cancelled" && "bg-muted text-muted-foreground line-through"
                      )}
                    >
                      {apt.hora_inicio} {apt.cliente_nome}
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#25D366]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Falar no WhatsApp"
                        >
                          <MessageCircle className="w-2 h-2 text-[#25D366]" />
                        </a>
                      )}
                    </div>
                  );
                })}
                {dayApts.length > 3 && (
                  <p className="text-[9px] text-muted-foreground pl-1">
                    +{dayApts.length - 3} mais
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

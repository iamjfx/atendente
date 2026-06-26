import { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay, parse } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/appointment";
import { statusColor } from "@/lib/statusHelpers";

interface Props {
  currentDate: Date;
  appointments: Appointment[];
  onSelectAppointment: (apt: Appointment) => void;
  onSlotClick: (day: Date, time: string) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 - 20:00
const SLOT_HEIGHT = 48;

export default function WeekTimeline({ currentDate, appointments, onSelectAppointment, onSlotClick }: Props) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const getAptsForDay = (day: Date) =>
    appointments.filter((a) => {
      const d = parse((a.data || "").split("T")[0], "yyyy-MM-dd", new Date());
      return isSameDay(d, day);
    });

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  return (
    <div className="overflow-auto h-[calc(100vh-280px)] lg:h-[calc(100vh-210px)]">
      <div className="min-w-[700px]">
        {/* Header - day names */}
        <div className="flex border-b border-border sticky top-0 bg-background z-10">
          <div className="w-12 shrink-0" />
          {weekDays.map((day) => {
            const isHoje = isSameDay(day, now);
            return (
              <div key={day.toISOString()} className="flex-1 text-center py-2">
                <p className="text-[10px] text-muted-foreground uppercase">
                  {format(day, "EEE", { locale: ptBR }).slice(0, 3)}
                </p>
                <p className={cn("text-sm font-semibold", isHoje && "text-primary")}>
                  {format(day, "d")}
                </p>
              </div>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="relative" style={{ height: HOURS.length * SLOT_HEIGHT * 2 }}>
          {/* Hour lines */}
          {HOURS.map((hour) => (
            <div key={hour} className="absolute left-0 right-0 border-t border-border" style={{ top: (hour - 7) * SLOT_HEIGHT * 2 }}>
              <span className="absolute -top-2.5 left-1 text-[10px] text-muted-foreground w-10 text-right">
                {String(hour).padStart(2, "0")}:00
              </span>
            </div>
          ))}

          {/* Grid columns per day */}
          <div className="flex ml-12 h-full">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="flex-1 relative border-l border-border/30">
                {/* Slot click areas */}
                {HOURS.map((hour) =>
                  [0, 1].map((half) => {
                    const time = `${String(hour).padStart(2, "0")}:${half === 0 ? "00" : "30"}`;
                    return (
                      <div
                        key={`${hour}-${half}`}
                        className="border-b border-border/20 cursor-pointer hover:bg-accent/20 transition-colors"
                        style={{ height: SLOT_HEIGHT, width: "100%" }}
                        onClick={() => onSlotClick(day, time)}
                      />
                    );
                  })
                )}

                {/* Appointments */}
                {getAptsForDay(day).map((apt) => {
                  const [h, m] = apt.hora_inicio.split(":").map(Number);
                  const [eh, em] = apt.hora_fim.split(":").map(Number);
                  const top = (h - 7) * 60 * (SLOT_HEIGHT / 30) + m * (SLOT_HEIGHT / 30);
                  const height = Math.max(((eh * 60 + em) - (h * 60 + m)) * (SLOT_HEIGHT / 30), SLOT_HEIGHT);

                  return (
                    <div
                      key={apt.id}
                      onClick={() => onSelectAppointment(apt)}
                      className={cn(
                        "absolute left-0.5 right-0.5 rounded border px-1 py-0.5 cursor-pointer overflow-hidden transition-all hover:shadow-md z-[5]",
                        statusColor(apt.status)
                      )}
                      style={{ top, height }}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate leading-tight">{apt.cliente_nome}</p>
                          <p className="text-[10px] text-muted-foreground truncate leading-tight">{apt.servico}</p>
                          <p className="text-[10px] text-muted-foreground/70">{apt.hora_inicio}</p>
                        </div>
                        {(() => {
                          const phone = apt.telefone?.replace(/\D/g, "");
                          const url = phone ? `https://api.whatsapp.com/send?phone=55${phone}` : null;
                          return url ? (
                            <div className="flex justify-end">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-0.5 text-[9px] text-[#25D366] hover:text-[#20ba5a] font-medium"
                                title="Falar no WhatsApp"
                              >
                                <MessageCircle className="w-2.5 h-2.5" />
                                WhatsApp
                              </a>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Current time indicator - full week width */}
            {currentHour >= 7 && currentHour <= 20 && (
              <div
                className="absolute left-12 right-0 border-t-2 border-destructive z-10 pointer-events-none"
                style={{ top: (currentHour - 7) * SLOT_HEIGHT * 2 }}
              >
                <div className="w-2 h-2 rounded-full bg-destructive -mt-1 -ml-1" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

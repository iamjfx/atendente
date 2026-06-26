import { useMemo } from "react";
import { isSameDay, format, parse } from "date-fns";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/appointment";
import { statusColor } from "@/lib/statusHelpers";

interface Props {
  selectedDate: Date;
  appointments: Appointment[];
  onSelectAppointment: (apt: Appointment) => void;
  onSlotClick: (time: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_HEIGHT = 48;

export default function DayTimeline({ selectedDate, appointments, onSelectAppointment, onSlotClick }: Props) {
  const dayApts = useMemo(
    () =>
      appointments.filter((a) => {
        const aptDate = parse((a.data || "").split("T")[0], "yyyy-MM-dd", new Date());
        return isSameDay(aptDate, selectedDate) && a.status !== "cancelled" && a.status !== "completed";
      }),
    [appointments, selectedDate]
  );

  const completedApts = useMemo(
    () =>
      appointments.filter((a) => {
        const aptDate = parse((a.data || "").split("T")[0], "yyyy-MM-dd", new Date());
        return isSameDay(aptDate, selectedDate) && (a.status === "cancelled" || a.status === "completed");
      }),
    [appointments, selectedDate]
  );

  return (
    <div className="relative overflow-y-auto h-[calc(100vh-280px)] lg:h-[calc(100vh-210px)]">
      <div className="relative" style={{ height: HOURS.length * SLOT_HEIGHT * 2 }}>
        {/* Hour lines and labels */}
        {HOURS.map((hour) => (
          <div key={hour}>
            <div className="absolute left-0 right-0 border-t border-border" style={{ top: hour * SLOT_HEIGHT * 2 }}>
              <span className="absolute -top-2.5 left-1 text-[10px] text-muted-foreground w-10 text-right">
                {String(hour).padStart(2, "0")}:00
              </span>
            </div>
            {/* Half-hour slot click areas */}
            {[0, 1].map((half) => {
              const time = `${String(hour).padStart(2, "0")}:${half === 0 ? "00" : "30"}`;
              return (
                <div
                  key={half}
                  className="absolute left-12 right-0 border-b border-border/30 cursor-pointer hover:bg-accent/30 transition-colors"
                  style={{ top: (hour * 2 + half) * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                  onClick={() => onSlotClick(time)}
                />
              );
            })}
          </div>
        ))}

        {/* Appointment blocks */}
        {dayApts.map((apt) => {
          const [h, m] = apt.hora_inicio.split(":").map(Number);
          const [eh, em] = apt.hora_fim.split(":").map(Number);
          const top = (h * 60 + m) * (SLOT_HEIGHT / 30);
          const height = Math.max(((eh * 60 + em) - (h * 60 + m)) * (SLOT_HEIGHT / 30), SLOT_HEIGHT);

          return (
            <div
              key={apt.id}
              onClick={() => onSelectAppointment(apt)}
              className={cn(
                "absolute left-12 right-1 rounded-lg border px-2 py-1.5 cursor-pointer overflow-hidden transition-all hover:shadow-md group",
                statusColor(apt.status)
              )}
              style={{ top, height, minHeight: SLOT_HEIGHT }}
            >
              <p className="text-sm font-semibold truncate">{apt.cliente_nome}</p>
              <p className="text-xs opacity-80 truncate">{apt.servico}</p>
              <p className="text-xs opacity-60">
                {apt.hora_inicio} - {apt.hora_fim}
              </p>
              {(() => {
                const phone = apt.telefone?.replace(/\D/g, "");
                const url = phone ? `https://api.whatsapp.com/send?phone=55${phone}` : null;
                return url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#25D366]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Falar no WhatsApp"
                  >
                    <MessageCircle className="w-3 h-3 text-[#25D366]" />
                  </a>
                ) : null;
              })()}
            </div>
          );
        })}

        {/* Completed/Cancelled in smaller faded blocks */}
        {completedApts.map((apt) => {
          const [h, m] = apt.hora_inicio.split(":").map(Number);
          const top = (h * 60 + m) * (SLOT_HEIGHT / 30);
          return (
            <div
              key={apt.id}
              onClick={() => onSelectAppointment(apt)}
              className={cn(
                "absolute left-12 right-1 rounded border px-1.5 py-0.5 cursor-pointer overflow-hidden opacity-50",
                statusColor(apt.status)
              )}
              style={{ top, height: SLOT_HEIGHT - 4 }}
            >
              <p className="text-[10px] truncate">{apt.cliente_nome}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

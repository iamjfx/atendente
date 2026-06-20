import type { AppointmentStatus } from "@/types/appointment";

export const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export function statusColor(status: AppointmentStatus): string {
  switch (status) {
    case "pending":
      return "bg-yellow-500/15 border-yellow-500/40 text-yellow-700";
    case "confirmed":
      return "bg-success/15 border-success/40 text-success";
    case "completed":
      return "bg-primary/15 border-primary/40 text-primary";
    case "cancelled":
      return "bg-muted border-border text-muted-foreground line-through";
  }
}

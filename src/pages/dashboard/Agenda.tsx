import { useState, useCallback } from "react";
import { format } from "date-fns";
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Calendar, Plus, Filter, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import type { Appointment, AppointmentFormData, AppointmentStatus } from "@/types/appointment";
import DayTimeline from "@/components/agenda/DayTimeline";
import WeekTimeline from "@/components/agenda/WeekTimeline";
import MonthTimeline from "@/components/agenda/MonthTimeline";
import { MiniCalendar } from "@/components/agenda/MonthYearNav";
import DayCarousel from "@/components/agenda/DayCarousel";
import AppointmentSheet from "@/components/agenda/AppointmentSheet";

type ViewMode = "diaria" | "semanal" | "mensal";

export default function Agenda() {
  const { appointments, loading, save, remove, setStatus, reload } = useAgendamentos();
  const [viewMode, setViewMode] = useState<ViewMode>("diaria");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [search, setSearch] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter !== "all" && apt.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!apt.cliente_nome.toLowerCase().includes(q) && !apt.servico.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openNew = useCallback((date?: string, time?: string) => {
    setEditingAppointment(null);
    setSlotDate(date ?? "");
    setSlotTime(time ?? "");
    setSheetOpen(true);
  }, []);

  const openEdit = useCallback((apt: Appointment) => {
    setEditingAppointment(apt);
    setSlotDate("");
    setSlotTime("");
    setSheetOpen(true);
  }, []);

  const handleSave = async (data: AppointmentFormData & { id?: string }) => {
    await save(data as Partial<Appointment> & Pick<Appointment, "cliente_nome" | "data" | "hora_inicio" | "hora_fim" | "servico">);
  };

  const handleSlotClick = (time: string) => {
    openNew(format(selectedDate, "yyyy-MM-dd"), time);
  };

  const handleWeekSlotClick = (day: Date, time: string) => {
    openNew(format(day, "yyyy-MM-dd"), time);
  };

  const statusFilterOptions: { label: string; value: AppointmentStatus | "all" }[] = [
    { label: "Todos", value: "all" },
    { label: "Pendente", value: "pending" },
    { label: "Confirmado", value: "confirmed" },
    { label: "Concluído", value: "completed" },
    { label: "Cancelado", value: "cancelled" },
  ];

  return (
    <div className="space-y-4">
      {/* Header + View toggle combined */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-foreground">Agenda</h2>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            {formatDate(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
            {(["diaria", "semanal", "mensal"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                  viewMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "diaria" ? "Dia" : mode === "semanal" ? "Sem" : "Mês"}
              </button>
            ))}
          </div>
          <Button size="xs" className="rounded-full h-7 text-[11px]" onClick={() => openNew()}>
            <Plus className="w-3 h-3 mr-0.5" />
            Novo
          </Button>
        </div>
      </div>

      {/* Filters + Search (desktop) */}
      <div className="hidden md:flex items-center gap-2">
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | "all")}
            className="pl-7 pr-3 h-7 text-[11px] rounded-lg border border-input bg-background appearance-none cursor-pointer"
          >
            {statusFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <List className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-7 text-[11px] w-36"
          />
        </div>
      </div>

      {/* Mobile carousel */}
      <div className="md:hidden">
        <DayCarousel selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar - visible on desktop */}
        <div className="hidden lg:block space-y-4">
          <MiniCalendar
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            appointments={filteredAppointments}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />
          {/* Status filter */}
          <div className="space-y-1">
            {statusFilterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  statusFilter === opt.value
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : viewMode === "diaria" ? (
            <DayTimeline
              selectedDate={selectedDate}
              appointments={filteredAppointments}
              onSelectAppointment={openEdit}
              onSlotClick={handleSlotClick}
            />
          ) : viewMode === "semanal" ? (
            <WeekTimeline
              currentDate={selectedDate}
              appointments={filteredAppointments}
              onSelectAppointment={openEdit}
              onSlotClick={handleWeekSlotClick}
            />
          ) : (
            <MonthTimeline
              currentMonth={currentMonth}
              appointments={filteredAppointments}
              onSelectDate={setSelectedDate}
              onSelectAppointment={openEdit}
            />
          )}
        </div>
      </div>

      {/* Appointment Sheet */}
      <AppointmentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        appointment={editingAppointment}
        defaultDate={slotDate}
        defaultTime={slotTime}
        onSave={handleSave}
        onDelete={remove}
        onStatusChange={async (id, status) => {
          await setStatus(id, status);
          if (editingAppointment) {
            setEditingAppointment({ ...editingAppointment, status });
          }
        }}
      />
    </div>
  );
}

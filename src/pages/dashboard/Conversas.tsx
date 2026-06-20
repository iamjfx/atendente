import { useEffect, useState } from "react";
import { MessageCircle, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/contexts/AccountContext";

interface Conversation {
  id: string;
  remote_jid: string;
  contact_name: string | null;
  contact_phone: string | null;
  last_message_preview: string | null;
  last_message_at: string;
  unread_count: number;
  status: string;
}

export default function Conversas() {
  const { profile } = useAccount();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!profile?.id) return;
    loadConversations();
  }, [profile?.id]);

  async function loadConversations() {
    setLoading(true);
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("account_id", profile!.id)
      .eq("status", "active")
      .order("last_message_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data);
    setLoading(false);
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return `${Math.floor(diff / 60000)}min`;
    if (hours < 24) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.contact_name?.toLowerCase().includes(q) ||
      c.contact_phone?.includes(q) ||
      c.last_message_preview?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Conversas</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {conversations.length} conversas
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar conversas..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">
            {search ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "Tente outro termo de busca" : "Conecte o WhatsApp para começar"}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((conv) => (
            <div
              key={conv.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {conv.contact_name || conv.contact_phone || conv.remote_jid.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {conv.last_message_preview || "..."}
                </p>
              </div>
              {(conv.unread_count ?? 0) > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                  {conv.unread_count > 9 ? "9+" : conv.unread_count}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { MessageCircle, Search, Loader2, Send, Bot, User, Check, AlertCircle, Play, Pause, Smartphone, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/contexts/AccountContext";
import { toast } from "sonner";

interface Conversation {
  id: string;
  instance_id: string;
  remote_jid: string;
  contact_name: string | null;
  contact_phone: string | null;
  last_message_preview: string | null;
  last_message_at: string;
  unread_count: number;
  status: string;
}

interface Message {
  id: string;
  conversation_id: string;
  remote_jid: string;
  from_me: boolean;
  content: string | null;
  ai_processed: boolean;
  created_at: string;
}

export default function Conversas() {
  const { profile } = useAccount();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "manual">("all");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages list to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations list
  useEffect(() => {
    if (!profile?.id) return;
    loadConversations();

    // Subscribe to conversation updates in real-time
    const channel = supabase
      .channel("conversations_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `account_id=eq.${profile.id}` },
        () => {
          loadConversations(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Subscribe to messages in real-time for the selected conversation
  useEffect(() => {
    if (!selectedConv?.id) {
      setMessages([]);
      return;
    }

    loadMessages(selectedConv.id);

    const channel = supabase
      .channel(`realtime:messages:${selectedConv.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    // Clear unread count on selection
    if (selectedConv.unread_count > 0) {
      supabase
        .from("conversations")
        .update({ unread_count: 0 })
        .eq("id", selectedConv.id)
        .then(() => {
          setConversations((prev) =>
            prev.map((c) => (c.id === selectedConv.id ? { ...c, unread_count: 0 } : c))
          );
        });
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConv?.id]);

  async function loadConversations(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("account_id", profile!.id)
        .order("last_message_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      if (data) {
        setConversations(data);
        // Refresh selected conversation reference to get updated status/preview
        if (selectedConv) {
          const updated = data.find((c) => c.id === selectedConv.id);
          if (updated) setSelectedConv(updated);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar conversas:", err.message);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  async function loadMessages(conversationId: string) {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      if (data) setMessages(data);
    } catch (err: any) {
      toast.error("Erro ao carregar mensagens: " + err.message);
    } finally {
      setLoadingMessages(false);
    }
  }

  // Toggle IA responding state (status = active (IA on), archived (IA off/Manual))
  async function toggleIaStatus(conv: Conversation) {
    const newStatus = conv.status === "active" ? "archived" : "active";
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ status: newStatus })
        .eq("id", conv.id);

      if (error) throw error;
      
      setSelectedConv({ ...conv, status: newStatus });
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, status: newStatus } : c))
      );
      
      if (newStatus === "archived") {
        toast.success("IA pausada. Suporte manual ativo para esta conversa.");
      } else {
        toast.success("IA ativada para esta conversa.");
      }
    } catch (err: any) {
      toast.error("Erro ao alterar status: " + err.message);
    }
  }

  // Send a manual message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConv || !profile) return;

    setSendingMessage(true);
    const content = messageInput.trim();
    setMessageInput("");

    try {
      // 1. Insert into messages table (local display)
      const { data: newMsg, error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConv.id,
          remote_jid: selectedConv.remote_jid,
          instance_id: selectedConv.instance_id,
          from_me: true,
          content,
          ai_processed: false,
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // 2. Insert into message_queue for delivery
      const { error: queueError } = await supabase
        .from("message_queue")
        .insert({
          conversation_id: selectedConv.id,
          instance_id: selectedConv.instance_id,
          remote_jid: selectedConv.remote_jid,
          content,
          status: "pending",
        });

      if (queueError) throw queueError;

      // 3. Update preview & set status to archived (automatic hand-off to manual)
      const { error: convError } = await supabase
        .from("conversations")
        .update({
          last_message_preview: content.slice(0, 100),
          last_message_at: new Date().toISOString(),
          status: "archived", // Human override pauses IA
        })
        .eq("id", selectedConv.id);

      if (convError) throw convError;

      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }

      // Automatically reflect manual support state in state
      setSelectedConv((prev) => prev ? { ...prev, status: "archived" } : null);
      
      toast.success("Mensagem enviada. IA pausada para esta conversa.");
    } catch (err: any) {
      toast.error("Erro ao enviar mensagem: " + err.message);
    } finally {
      setSendingMessage(false);
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return `${Math.max(1, Math.floor(diff / 60000))}min`;
    if (hours < 24) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  // Filter conversations based on active tab & search
  const filtered = conversations.filter((c) => {
    const matchesSearch =
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_phone?.includes(search) ||
      c.last_message_preview?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "active" && c.status === "active") ||
      (activeFilter === "manual" && c.status === "archived");

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 border rounded-xl overflow-hidden bg-card/40 shadow-sm">
      {/* LEFT COLUMN: CONVERSATION LIST */}
      <div className={`w-full lg:w-80 flex flex-col border-r bg-card ${selectedConv ? "hidden lg:flex" : "flex"}`}>
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              Chats do WhatsApp
            </h2>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-semibold">
              {filtered.length}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-1 bg-muted/50 p-0.5 rounded-lg text-xs">
            {(["all", "active", "manual"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-1 py-1 rounded-md font-semibold transition-all ${
                  activeFilter === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "Todos" : f === "active" ? "🤖 IA" : "👤 Manual"}
              </button>
            ))}
          </div>
        </div>

        {/* List of Chats */}
        <div className="flex-1 overflow-y-auto divide-y">
          {filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-xs text-muted-foreground">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = selectedConv?.id === conv.id;
              const isIaActive = conv.status === "active";
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`flex items-start gap-3 p-3 cursor-pointer transition-all hover:bg-muted/40 relative ${
                    isActive ? "bg-muted/70 border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0 border relative">
                    <MessageCircle className="w-5 h-5 text-primary/80" />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-background ${
                      isIaActive ? "bg-indigo-500" : "bg-orange-500"
                    }`} title={isIaActive ? "IA Ativa" : "Suporte Manual"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-foreground truncate">
                        {conv.contact_name || conv.contact_phone || "Cliente"}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {conv.last_message_preview || "..."}
                    </p>
                    
                    <div className="flex items-center gap-1.5 mt-1">
                      {isIaActive ? (
                        <span className="inline-flex items-center text-[9px] font-semibold text-indigo-500 bg-indigo-500/10 px-1 rounded">
                          <Bot className="w-2.5 h-2.5 mr-0.5" /> IA Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[9px] font-semibold text-orange-500 bg-orange-500/10 px-1 rounded">
                          <User className="w-2.5 h-2.5 mr-0.5" /> Manual
                        </span>
                      )}
                    </div>
                  </div>
                  {(conv.unread_count ?? 0) > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shrink-0 absolute top-3 right-3">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CHAT CONVERSATION WINDOW */}
      <div className={`flex-1 flex flex-col bg-muted/10 h-full ${!selectedConv ? "hidden lg:flex" : "flex"}`}>
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConv(null)}
                  className="lg:hidden p-1 hover:bg-muted rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div>
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    {selectedConv.contact_name || selectedConv.contact_phone || "Cliente"}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    {selectedConv.contact_phone ? `+${selectedConv.contact_phone}` : "WhatsApp"}
                  </p>
                </div>
              </div>

              {/* Toggle IA Autonomy Button */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 transition-all ${
                  selectedConv.status === "active"
                    ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                    : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                }`}>
                  {selectedConv.status === "active" ? (
                    <>
                      <Bot className="w-3.5 h-3.5" /> 🤖 IA Respondendo
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5" /> 👤 Suporte Manual
                    </>
                  )}
                </span>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold"
                  onClick={() => toggleIaStatus(selectedConv)}
                >
                  {selectedConv.status === "active" ? (
                    <>
                      <Pause className="w-3 h-3 mr-1" /> Pausar IA
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1 text-green-500" /> Ativar IA
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhuma mensagem neste chat</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.from_me;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fadeIn`}
                    >
                      <div className={`max-w-[70%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm relative group ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-card text-foreground rounded-tl-none border"
                      }`}>
                        {/* If model sent message, display if it was AI generated */}
                        {isMe && msg.ai_processed && (
                          <div className="flex items-center text-[9px] text-primary-foreground/70 font-semibold mb-1">
                            <Bot className="w-3 h-3 mr-0.5" /> IA
                          </div>
                        )}
                        {isMe && !msg.ai_processed && (
                          <div className="flex items-center text-[9px] text-primary-foreground/70 font-semibold mb-1">
                            <User className="w-3 h-3 mr-0.5" /> Manual
                          </div>
                        )}

                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[8px] ${
                          isMe ? "text-primary-foreground/60" : "text-muted-foreground/75"
                        }`}>
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMe && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t bg-card flex items-center gap-2">
              <Input
                placeholder={
                  selectedConv.status === "active" 
                    ? "Digite para assumir o chat manualmente (desativa a IA)..."
                    : "Escreva uma mensagem..."
                }
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                disabled={sendingMessage}
                className="flex-1 text-xs"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-9 w-9 shrink-0 rounded-full" 
                disabled={!messageInput.trim() || sendingMessage}
              >
                {sendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageCircle className="w-16 h-16 text-muted-foreground/20 mb-4 animate-bounce" />
            <h3 className="text-sm font-bold text-foreground">Nenhuma conversa selecionada</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
              Selecione um chat na lista lateral para visualizar o histórico de mensagens, intervir no suporte e ligar/desligar o piloto automático da IA.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

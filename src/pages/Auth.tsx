import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { db } from "@/integrations/db/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="hsl(220,78%,48%)" />
    <path d="M6 13.5C6 10.462 8.462 8 11.5 8H12.5C15.538 8 18 10.462 18 13.5C18 16.538 15.538 19 12.5 19H11.5C10.5 19 9.5 18.5 9 18L6 19L7 16.5C6.5 15.8 6 14.8 6 13.5Z" fill="white" />
    <circle cx="10" cy="12" r="0.5" fill="hsl(220,78%,48%)" />
    <circle cx="12" cy="12" r="0.5" fill="hsl(220,78%,48%)" />
    <circle cx="14" cy="12" r="0.5" fill="hsl(220,78%,48%)" />
  </svg>
);

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const from = (location.state as any)?.from ?? "/admin";

  const [tab, setTab] = useState<"login" | "signup">(
    (location.state as any)?.tab === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if ((location.state as any)?.error === "no_product") {
      signOut();
      setError("Assinatura do Atendente inativa. Por favor, entre em contato com o suporte em contato@controletotal.app.");
    }
  }, [location.state, signOut]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    navigate(from, { replace: true });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const checkRes = await fetch(`${API_BASE}/auth/check-email?email=${encodeURIComponent(email)}`);
      if (!checkRes.ok) {
        throw new Error("Erro ao verificar o e-mail na base de dados.");
      }
      const checkData = await checkRes.json();
      if (checkData.exists) {
        if (checkData.hasAtendente) {
          setError("Esta conta já existe. Por favor, acesse a aba 'Entrar' e faça login.");
          setBusy(false);
          return;
        } else {
          setError(`Olá, ${checkData.nome}! Identificamos seu cadastro no Controle Total. Você está prestes a adicionar o Atendente como um produto adicional à sua conta! Para prosseguir com essa contratação, acesse a aba 'Entrar' e faça login com seus dados atuais.`);
          setBusy(false);
          return;
        }
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor.");
      setBusy(false);
      return;
    }

    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
      },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    if (!data.session) {
      // Tenta fazer o login automático com a senha fornecida
      const { error: loginError } = await db.auth.signInWithPassword({ email, password });
      if (loginError) {
        setError(loginError.message);
        setBusy(false);
        return;
      }
    }

    setBusy(false);
    navigate(from, { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-success/10 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <Link to="/"><Logo /></Link>
          </div>
          <CardTitle className="text-xl">
            {tab === "login" ? "Entrar" : "Criar conta"}
          </CardTitle>
          <CardDescription>
            {tab === "login"
              ? "Entre com seu email e senha"
              : "Crie sua conta no Atendente"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4 border rounded-lg overflow-hidden">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === "login" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setTab("signup"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === "signup" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={tab === "login" ? handleLogin : handleSignup} className="space-y-4">
            {tab === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>

            {error && (
              <p className={`text-sm text-center ${error.includes("Verifique") ? "text-success" : "text-destructive"}`}>
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tab === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

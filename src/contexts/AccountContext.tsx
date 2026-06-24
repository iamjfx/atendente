import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/integrations/db/client";

interface ProductAccess {
  slug: string;
  ativo: boolean;
}

interface AccountContextValue {
  profile: {
    id: string;
    nome: string;
    nome_usuario: string | null;
    nome_ia: string | null;
    email: string | null;
    nome_fantasia: string | null;
    logo_url: string | null;
    onboarding_completo: boolean;
    telefone: string | null;
    cnpj_cpf: string | null;
    cidade: string | null;
    uf: string | null;
    ramo_atividade: string | null;
    ramo_outro: string | null;
  } | null;
  products: ProductAccess[];
  loading: boolean;
  hasProduct: (slug: string) => boolean;
  refetch: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue>({
  profile: null,
  products: [],
  loading: true,
  hasProduct: () => false,
  refetch: async () => {},
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AccountContextValue["profile"]>(null);
  const [products, setProducts] = useState<ProductAccess[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    
    let profileData: any = null;

    const { data: dataWithIa, error: errorWithIa } = await db
      .from("profiles")
      .select("id, nome, nome_usuario, nome_ia, email, nome_fantasia, logo_url, onboarding_completo, telefone, cnpj_cpf, cidade, uf, ramo_atividade, ramo_outro")
      .eq("id", user.id)
      .single();

    if (!errorWithIa) {
      profileData = dataWithIa;
    } else {
      // Se falhar porque nome_ia não existe, tenta sem ela
      const { data: dataWithoutIa, error: errorWithoutIa } = await db
        .from("profiles")
        .select("id, nome, nome_usuario, email, nome_fantasia, logo_url, onboarding_completo, telefone, cnpj_cpf, cidade, uf, ramo_atividade, ramo_outro")
        .eq("id", user.id)
        .single();
      
      if (!errorWithoutIa && dataWithoutIa) {
        profileData = {
          ...dataWithoutIa,
          nome_ia: null
        };
      }
    }

    const ownerId = profileData?.id ?? user.id;

    const { data: productRows } = await db
      .from("account_products")
      .select("product_slug, ativo")
      .eq("account_id", ownerId);

    setProfile(profileData ?? {
      id: user.id,
      nome: user.email ?? "",
      nome_usuario: null,
      nome_ia: null,
      email: user.email,
      nome_fantasia: null,
      logo_url: null,
      onboarding_completo: false,
      telefone: null,
      cnpj_cpf: null,
      cidade: null,
      uf: null,
      ramo_atividade: null,
      ramo_outro: null
    });

    const loaded = productRows?.map(r => ({ slug: r.product_slug, ativo: r.ativo })) ?? [];

    const idx = loaded.findIndex(p => p.slug === "atendente");
    if (idx === -1) {
      try {
        await db.from("account_products").insert({
          account_id: ownerId,
          product_slug: "atendente",
          ativo: true
        });
      } catch (err) {
        console.error("Erro ao registrar produto no banco:", err);
      }
      loaded.push({ slug: "atendente", ativo: true });
    }

    setProducts(loaded);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProducts([]);
      setLoading(false);
      return;
    }

    load();
  }, [user]);

  const refetch = async () => {
    await load();
  };

  const hasProduct = (slug: string) => {
    if (slug === "atendente") return true;
    return products.some(p => p.slug === slug && p.ativo);
  };

  return (
    <AccountContext.Provider value={{ profile, products, loading, hasProduct, refetch }}>
      {children}
    </AccountContext.Provider>
  );
}

export const useAccount = () => useContext(AccountContext);

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, nome, nome_usuario, nome_ia, email, nome_fantasia, logo_url, onboarding_completo")
      .eq("id", user.id)
      .single();

    const ownerId = profileData?.id ?? user.id;

    const { data: productRows } = await supabase
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
      onboarding_completo: false
    });

    const loaded = productRows?.map(r => ({ slug: r.product_slug, ativo: r.ativo })) ?? [];

    const idx = loaded.findIndex(p => p.slug === "atendente");
    if (idx >= 0) {
      loaded[idx].ativo = true;
    } else {
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

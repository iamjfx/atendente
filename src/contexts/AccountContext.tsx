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
    email: string | null;
    nome_fantasia: string | null;
    logo_url: string | null;
  } | null;
  products: ProductAccess[];
  loading: boolean;
  hasProduct: (slug: string) => boolean;
}

const AccountContext = createContext<AccountContextValue>({
  profile: null,
  products: [],
  loading: true,
  hasProduct: () => false,
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AccountContextValue["profile"]>(null);
  const [products, setProducts] = useState<ProductAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, nome, email, nome_fantasia, logo_url")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      const ownerId = profileData?.id ?? user.id;

      const { data: productRows } = await supabase
        .from("account_products")
        .select("product_slug, ativo")
        .eq("account_id", ownerId);

      if (cancelled) return;

      setProfile(profileData ?? { id: user.id, nome: user.email ?? "", email: user.email, nome_fantasia: null, logo_url: null });

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

    load();

    return () => { cancelled = true; };
  }, [user]);

  const hasProduct = (slug: string) => {
    return products.some(p => p.slug === slug && p.ativo);
  };

  return (
    <AccountContext.Provider value={{ profile, products, loading, hasProduct }}>
      {children}
    </AccountContext.Provider>
  );
}

export const useAccount = () => useContext(AccountContext);

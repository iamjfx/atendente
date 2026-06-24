import { db } from "./db.js";

export type ProductSlug = "atendente" | "controletotal";

export async function getAccountProductSlugs(accountId: string): Promise<ProductSlug[]> {
  const { data } = await db
    .from("account_products")
    .select("product_slug")
    .eq("account_id", accountId)
    .eq("ativo", true);

  if (!data) return ["atendente"];
  return data.map((p: any) => p.product_slug).filter(Boolean) as ProductSlug[];
}

export function hasProduct(slugs: string[], target: ProductSlug): boolean {
  if (target === "atendente") return true;
  return slugs.includes(target);
}

export function getProductTier(slugs: string[]): "basic" | "complete" {
  return hasProduct(slugs, "controletotal") ? "complete" : "basic";
}

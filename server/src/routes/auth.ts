import { Router, Response } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/check-email", async (req, res: Response) => {
  const { email } = req.query;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // 1. Check if profile exists with this email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("email", email.trim())
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      return res.json({
        exists: false,
        hasAtendente: false,
        nome: null,
      });
    }

    // 2. Check if they have Atendente active
    const { data: product, error: productError } = await supabase
      .from("account_products")
      .select("ativo")
      .eq("account_id", profile.id)
      .eq("product_slug", "atendente")
      .eq("ativo", true)
      .maybeSingle();

    if (productError) {
      throw productError;
    }

    return res.json({
      exists: true,
      hasAtendente: !!product,
      nome: profile.nome,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

export default router;

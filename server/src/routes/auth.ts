import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, pool } from "../lib/db.js";
import { config } from "../config.js";

const router = Router();

if (!process.env.DB_PASSWORD) {
  console.error('ERRO CRÍTICO: DB_PASSWORD não definido. Configure a variável de ambiente.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('ERRO CRÍTICO: JWT_SECRET não definido. Configure a variável de ambiente.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/login", async (req, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, encrypted_password FROM auth.users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.encrypted_password);
    if (!valid) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        sub: user.id,
        email: user.email,
        aud: "authenticated",
        role: "authenticated",
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      JWT_SECRET
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        aud: "authenticated",
        role: "authenticated",
      },
    });
  } catch (err: any) {
    console.error("Erro no login:", err.message);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/register", async (req, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
  }

  try {
    const emailLower = email.trim().toLowerCase();

    const existing = await pool.query(
      'SELECT id FROM auth.users WHERE email = $1',
      [emailLower]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Este email já está cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id, aud, role)
       VALUES (gen_random_uuid(), $1, $2, $3, $3, $3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
       RETURNING id, email`,
      [emailLower, hashedPassword, now]
    );

    const user = result.rows[0];

    const { error: profileError } = await db.from("profiles").insert({
      id: user.id,
      email: user.email,
      nome: emailLower.split("@")[0],
      onboarding_completo: false,
    });

    if (profileError) {
      console.error("Erro ao criar profile:", profileError.message);
    }

    await db.from("ia_configs").insert({
      account_id: user.id,
      autonomy_level: "full",
      collect_name: true,
      collect_phone: false,
      collect_service: true,
      collect_address: true,
      deslocamento_minutos: 30,
    });

    const businessHoursDefaults = [1, 2, 3, 4, 5].map((dia) => ({
      user_id: user.id,
      dia_semana: dia,
      abre: "08:00",
      fecha: "18:00",
      ativo: true,
    }));
    await db.from("business_hours").insert(businessHoursDefaults);

    const token = jwt.sign(
      {
        id: user.id,
        sub: user.id,
        email: user.email,
        aud: "authenticated",
        role: "authenticated",
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      JWT_SECRET
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        aud: "authenticated",
        role: "authenticated",
      },
    });
  } catch (err: any) {
    console.error("Erro no registro:", err.message);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/check-email", async (req, res: Response) => {
  const { email } = req.query;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const { data: profile, error: profileError } = await db
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

    const { data: product, error: productError } = await db
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

router.get("/me", async (req, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    return res.json({
      id: decoded.sub,
      email: decoded.email,
      aud: decoded.aud,
      role: decoded.role,
    });
  } catch (err: any) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
});

export default router;

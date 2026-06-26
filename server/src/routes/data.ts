import { Router, Response } from "express";
import { db } from "../lib/db.js";
import { AuthenticatedRequest, authMiddleware } from "../middlewares/auth.js";

const router = Router();

const ALLOWED_TABLES = [
  "profiles",
  "evolution_instances",
  "conversations",
  "messages",
  "account_products",
  "message_queue",
  "agendamentos",
  "orcamentos",
  "leads",
  "webhook_configs",
  "ia_configs",
  "business_hours",
  "servicos_catalogo",
  "clientes",
];

const TABLES_WITH_USER_ID = new Set([
  "agendamentos", "clientes", "conversations", "evolution_instances",
  "ia_configs", "business_hours", "servicos_catalogo", "orcamentos", "leads",
]);

function validateTable(table: string): string | null {
  if (!ALLOWED_TABLES.includes(table)) {
    return `Table "${table}" is not allowed`;
  }
  return null;
}

router.get("/:table", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { table } = req.params;
  const validationError = validateTable(table);
  if (validationError) {
    return res.status(403).json({ error: validationError });
  }

  try {
    let query = db.from(table).select("*");

    // Filtro automático pelo user_id do token (igual ao Controle Total)
    if (TABLES_WITH_USER_ID.has(table)) {
      query = query.eq("user_id", req.user.id);
    }

    for (const [col, val] of Object.entries(req.query)) {
      if (["single", "limit", "order"].includes(col)) continue;
      query = query.eq(col, val);
    }

    if (req.query.limit) {
      query = query.limit(Number(req.query.limit));
    }

    if (req.query.order) {
      const orders = Array.isArray(req.query.order) ? req.query.order : [req.query.order];
      for (const ord of orders) {
        const [col, dir] = (ord as string).split(".");
        query = query.order(col, { ascending: dir !== "desc" });
      }
    }

    if (req.query.single === "true") {
      query = query.maybeSingle();
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/:table", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { table } = req.params;
  const validationError = validateTable(table);
  if (validationError) {
    return res.status(403).json({ error: validationError });
  }

  try {
    const { data, error } = await db.from(table).insert(req.body).select().single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/:table/:id?", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { table, id } = req.params;
  const validationError = validateTable(table);
  if (validationError) {
    return res.status(403).json({ error: validationError });
  }

  try {
    let query = db.from(table).update(req.body);

    if (id) {
      query = query.eq("id", id);
    } else {
      for (const [col, val] of Object.entries(req.query)) {
        query = query.eq(col, val);
      }
    }

    const { data, error } = await query.select().single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/:table/:id?", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { table, id } = req.params;
  const validationError = validateTable(table);
  if (validationError) {
    return res.status(403).json({ error: validationError });
  }

  try {
    let query = db.from(table).delete();

    if (id) {
      query = query.eq("id", id);
    } else {
      for (const [col, val] of Object.entries(req.query)) {
        query = query.eq(col, val);
      }
    }

    const { data, error } = await query.single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

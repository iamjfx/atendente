import pg from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('ERRO CRÍTICO: JWT_SECRET não definido. Configure a variável de ambiente.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

const { Pool } = pg;

if (!process.env.DB_PASSWORD) {
  console.error('ERRO CRÍTICO: DB_PASSWORD não definido. Configure a variável de ambiente.');
  process.exit(1);
}

export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'controletotal',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

interface QueryFilter {
  col: string;
  op: string;
  val: any;
}

class QueryBuilder {
  private table: string;
  private method: string = 'SELECT';
  private selectCols: string = '*';
  private body: any = null;
  private filters: QueryFilter[] = [];
  private limitVal: number | null = null;
  private orderVal: string | null = null;
  private singleVal: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*') {
    if (this.method !== 'INSERT' && this.method !== 'UPDATE') {
      this.method = 'SELECT';
    }
    this.selectCols = columns;
    return this;
  }

  insert(values: any) {
    this.method = 'INSERT';
    this.body = values;
    return this;
  }

  update(values: any) {
    this.method = 'UPDATE';
    this.body = values;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ col: column, op: '=', val: value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ col: column, op: '>=', val: value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ col: column, op: '<=', val: value });
    return this;
  }

  not(column: string, operator: string, value: any) {
    const op = operator === 'eq' ? '!=' : operator === 'is' ? 'IS NOT' : '!=';
    this.filters.push({ col: column, op: op, val: value });
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push({ col: column, op: 'LIKE', val: pattern });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ col: column, op: 'IN', val: values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const dir = options?.ascending === false ? 'DESC' : 'ASC';
    const clause = `"${column}" ${dir}`;
    if (this.orderVal) {
      this.orderVal += `, ${clause}`;
    } else {
      this.orderVal = `ORDER BY ${clause}`;
    }
    return this;
  }

  limit(limit: number) {
    this.limitVal = limit;
    return this;
  }

  single() {
    this.singleVal = true;
    return this;
  }

  maybeSingle() {
    this.singleVal = true;
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      let sql = '';
      const params: any[] = [];
      let paramIdx = 1;

      if (this.method === 'SELECT') {
        if (this.table === 'message_queue' && this.selectCols.includes('evolution_instances')) {
          sql = `
            SELECT mq.*, ei.instance_name as "instance_name"
            FROM "message_queue" mq
            JOIN "evolution_instances" ei ON mq.instance_id = ei.id
          `;
        } else {
          sql = `SELECT * FROM "${this.table}"`;
        }

        const whereClauses: string[] = [];
        for (const f of this.filters) {
          const prefix = this.table === 'message_queue' && this.selectCols.includes('evolution_instances') ? 'mq.' : '';
          if (f.op === 'IN') {
            const vals = Array.isArray(f.val) ? f.val : [f.val];
            const placeholders = vals.map(() => `$${paramIdx++}`).join(', ');
            whereClauses.push(`${prefix}"${f.col}" IN (${placeholders})`);
            params.push(...vals);
          } else {
            whereClauses.push(`${prefix}"${f.col}" ${f.op} $${paramIdx++}`);
            params.push(f.val);
          }
        }

        if (whereClauses.length > 0) {
          sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        if (this.orderVal) {
          sql += ` ${this.orderVal}`;
        }

        if (this.limitVal !== null) {
          sql += ` LIMIT $${paramIdx++}`;
          params.push(this.limitVal);
        }
      } else if (this.method === 'INSERT') {
        const payload = Array.isArray(this.body) ? this.body : [this.body];
        const obj = payload[0];
        const keys = Object.keys(obj);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        sql = `INSERT INTO "${this.table}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders}) RETURNING ${this.selectCols}`;
        params.push(...keys.map(k => obj[k]));
      } else if (this.method === 'UPDATE') {
        const keys = Object.keys(this.body);
        const setClauses = keys.map((k) => `"${k}" = $${paramIdx++}`);
        params.push(...keys.map(k => this.body[k]));

        sql = `UPDATE "${this.table}" SET ${setClauses.join(', ')}`;
        const whereClauses: string[] = [];
        for (const f of this.filters) {
          if (f.op === 'IN') {
            const vals = Array.isArray(f.val) ? f.val : [f.val];
            const placeholders = vals.map(() => `$${paramIdx++}`).join(', ');
            whereClauses.push(`"${f.col}" IN (${placeholders})`);
            params.push(...vals);
          } else {
            whereClauses.push(`"${f.col}" ${f.op} $${paramIdx++}`);
            params.push(f.val);
          }
        }
        if (whereClauses.length > 0) {
          sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }
        sql += ' RETURNING *';
      } else if (this.method === 'DELETE') {
        sql = `DELETE FROM "${this.table}"`;
        const whereClauses: string[] = [];
        for (const f of this.filters) {
          if (f.op === 'IN') {
            const vals = Array.isArray(f.val) ? f.val : [f.val];
            const placeholders = vals.map(() => `$${paramIdx++}`).join(', ');
            whereClauses.push(`"${f.col}" IN (${placeholders})`);
            params.push(...vals);
          } else {
            whereClauses.push(`"${f.col}" ${f.op} $${paramIdx++}`);
            params.push(f.val);
          }
        }
        if (whereClauses.length > 0) {
          sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }
        sql += ' RETURNING *';
      }

      const res = await pool.query(sql, params);
      let data: any = res.rows;

      if (this.table === 'message_queue' && this.selectCols.includes('evolution_instances')) {
        data = res.rows.map((row: any) => {
          const newRow = { ...row };
          if (row.instance_name !== undefined) {
            newRow.evolution_instances = { instance_name: row.instance_name };
            delete newRow.instance_name;
          }
          return newRow;
        });
      }

      if (this.singleVal) {
        data = data[0] || null;
      }

      const result = { data, error: null };
      if (onfulfilled) return onfulfilled(result);
      return result;
    } catch (err: any) {
      console.error(`[Mock DB Error] Query falhou na tabela ${this.table}:`, err);
      const result = { data: null, error: { message: err.message } };
      if (onfulfilled) return onfulfilled(result);
      return result;
    }
  }
}

export const db = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  auth: {
    async getUser(token: string) {
      try {
        const decoded = jwt.decode(token) as any;
        if (!decoded) {
          return { data: { user: null }, error: { message: "Invalid token" } };
        }
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          return { data: { user: null }, error: { message: "Token expired" } };
        }
        const user = {
          id: decoded.id || decoded.sub,
          sub: decoded.sub,
          email: decoded.email,
          aud: decoded.aud,
          role: decoded.role,
        };
        return { data: { user }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message } };
      }
    }
  }
};

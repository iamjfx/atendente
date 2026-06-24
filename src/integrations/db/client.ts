// O base URL da API do Controle Total (onde estão a autenticação e as rotas genéricas de banco de dados compartilhadas)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

class QueryBuilder {
  private table: string;
  private method: string = 'GET';
  private body: any = null;
  private filters: Record<string, string> = {};
  private limitVal: number | null = null;
  private orderVal: string | null = null;
  private singleVal: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    this.method = 'GET';
    return this;
  }

  insert(values: any) {
    this.method = 'POST';
    this.body = Array.isArray(values) ? values[0] : values;
    return this;
  }

  update(values: any) {
    this.method = 'PUT';
    this.body = values;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = String(value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const dir = options?.ascending === false ? 'desc' : 'asc';
    this.orderVal = `${column}.${dir}`;
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
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const qParams = new URLSearchParams();
      if (this.singleVal) qParams.append('single', 'true');
      if (this.limitVal !== null) qParams.append('limit', String(this.limitVal));
      if (this.orderVal) qParams.append('order', this.orderVal);
      
      for (const [k, v] of Object.entries(this.filters)) {
        qParams.append(k, v);
      }

      const qString = qParams.toString();
      const url = `${API_URL}/api/db/${this.table}${qString ? '?' + qString : ''}`;

      const res = await fetch(url, {
        method: this.method,
        headers,
        body: this.body ? JSON.stringify(this.body) : undefined
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro na requisição ao banco local');
      }

      const data = await res.json();
      const result = { data, error: null };
      
      if (onfulfilled) {
        return onfulfilled(result);
      }
      return result;
    } catch (err: any) {
      const result = { data: null, error: { message: err.message || String(err) } };
      if (onfulfilled) {
        return onfulfilled(result);
      }
      return result;
    }
  }
}

class StorageBuilder {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async upload(path: string, file: File | Blob, options?: any) {
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);
      formData.append('bucket', this.bucket);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/storage/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no upload do arquivo');

      return { data: { path: data.filePath }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  async createSignedUrl(path: string, expiresIn: number) {
    const publicUrl = `${API_URL}/uploads/${this.bucket}/${path}`;
    return { data: { signedUrl: publicUrl }, error: null };
  }

  async remove(paths: string[]) {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/storage/remove`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ bucket: this.bucket, paths })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao remover arquivos');
      }

      return { data: { success: true }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }
}

const authListeners = new Set<(event: string, session: any) => void>();

function triggerAuthStateChange(event: string, session: any) {
  for (const callback of authListeners) {
    callback(event, session);
  }
}

export const db = {
  from(table: string) {
    return new QueryBuilder(table);
  },

  channel(name: string) {
    return {
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} }),
    };
  },

  removeChannel(channel: any) {},

  storage: {
    from(bucket: string) {
      return new StorageBuilder(bucket);
    }
  },

  functions: {
    async invoke(functionName: string, options?: any) {
      return { data: null, error: null };
    }
  },

  auth: {
    async signUp({ email, password }: any) {
      try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar');
        localStorage.setItem('auth_token', data.token);
        
        const session = { access_token: data.token, user: data.user };
        triggerAuthStateChange('SIGNED_IN', session);
        
        return { data: { user: data.user, session }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message } };
      }
    },

    async signInWithPassword({ email, password }: any) {
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'E-mail ou senha incorretos.');
        localStorage.setItem('auth_token', data.token);
        
        const session = { access_token: data.token, user: data.user };
        triggerAuthStateChange('SIGNED_IN', session);
        
        return { data: { user: data.user, session }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message } };
      }
    },

    async signOut() {
      localStorage.removeItem('auth_token');
      triggerAuthStateChange('SIGNED_OUT', null);
      return { error: null };
    },

    async getSession() {
      const token = localStorage.getItem('auth_token');
      if (!token) return { data: { session: null }, error: null };

      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const user = JSON.parse(jsonPayload);
        
        if (user.exp && Date.now() >= user.exp * 1000) {
          localStorage.removeItem('auth_token');
          return { data: { session: null }, error: null };
        }

        return { data: { session: { access_token: token, user } }, error: null };
      } catch {
        localStorage.removeItem('auth_token');
        return { data: { session: null }, error: null };
      }
    },

    async getUser() {
      const { data: { session } } = await this.getSession();
      if (!session) return { data: { user: null }, error: null };
      return { data: { user: session.user }, error: null };
    },

    onAuthStateChange(callback: any) {
      authListeners.add(callback);
      
      this.getSession().then(({ data: { session } }) => {
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      });
      
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            }
          }
        }
      };
    }
  }
};

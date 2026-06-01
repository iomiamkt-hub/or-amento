/**
 * Cache em memória com TTL de 60 segundos para dados do Google Sheets.
 *
 * Em ambientes serverless (Vercel), cada instância aquecida reutiliza o cache
 * entre requests. Novas instâncias buscam dados frescos e populam o cache
 * local. Isso garante:
 *   - No máximo 1 chamada à API Sheets por instância por minuto
 *   - Dados sempre atualizados em até 60 segundos após mudança na planilha
 */

const TTL_MS = 60_000; // 60 segundos

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, CacheEntry<any>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T): void {
  store.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

export function cacheInvalidate(key: string): void {
  store.delete(key);
}

export function cacheInvalidateAll(): void {
  store.clear();
}

/**
 * Helper: executa fn e armazena no cache. Reutiliza valor em cache se válido.
 */
export async function withCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;
  const data = await fn();
  cacheSet(key, data);
  return data;
}

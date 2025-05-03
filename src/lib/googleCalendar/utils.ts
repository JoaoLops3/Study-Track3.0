interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000; // 1 segundo

export async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    cacheKey?: string;
    cacheDuration?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = MAX_RETRIES,
    initialDelay = INITIAL_DELAY,
    cacheKey,
    cacheDuration = CACHE_DURATION
  } = options;

  // Verificar cache se houver uma chave
  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      console.log('Usando dados do cache para:', cacheKey);
      return cached.data;
    }
  }

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // Salvar no cache se houver uma chave
      if (cacheKey) {
        cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          expiresAt: Date.now() + cacheDuration
        });
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Verificar se é um erro de limite de taxa
      const isRateLimitError = error?.response?.status === 403 || error?.response?.status === 429;
      const errorData = error?.response?.data?.error;
      const isUserRateLimit = errorData?.errors?.[0]?.reason === 'userRateLimitExceeded';
      const isRateLimit = errorData?.errors?.[0]?.reason === 'rateLimitExceeded';
      const isQuotaExceeded = errorData?.errors?.[0]?.reason === 'quotaExceeded';

      if (isRateLimitError && (isUserRateLimit || isRateLimit || isQuotaExceeded)) {
        console.log(`Tentativa ${attempt} falhou devido a limite de taxa, aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Backoff exponencial
        continue;
      }

      // Se não for erro de limite de taxa, propaga o erro
      throw error;
    }
  }

  throw lastError;
}

export function clearCache(cacheKey?: string) {
  if (cacheKey) {
    cache.delete(cacheKey);
  } else {
    cache.clear();
  }
}

export function getCacheSize() {
  return cache.size;
}

export function getCacheKeys() {
  return Array.from(cache.keys());
} 
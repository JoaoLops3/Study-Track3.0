import { useState, useEffect } from 'react';

interface UseGoogleImageProps {
  src: string;
  maxRetries?: number;
  cacheTime?: number; // tempo em milissegundos
}

interface CachedImage {
  url: string;
  timestamp: number;
  retryCount: number;
}

const CACHE_KEY = 'google_images_cache';
const DEFAULT_CACHE_TIME = 24 * 60 * 60 * 1000; // 24 horas
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos

export function useGoogleImage({
  src,
  maxRetries = MAX_RETRIES,
  cacheTime = DEFAULT_CACHE_TIME
}: UseGoogleImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Função para gerenciar o cache
  const getCachedImage = (): string | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cache: Record<string, CachedImage> = JSON.parse(cached);
      const cachedImage = cache[src];

      if (cachedImage && Date.now() - cachedImage.timestamp < cacheTime) {
        return cachedImage.url;
      }

      // Remove do cache se expirado
      delete cache[src];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    } catch {
      return null;
    }
  };

  // Função para salvar no cache
  const saveToCache = (url: string, retryCount: number) => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const cache: Record<string, CachedImage> = cached ? JSON.parse(cached) : {};
      
      cache[src] = {
        url,
        timestamp: Date.now(),
        retryCount
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  };

  // Função para carregar a imagem com retry
  const loadImage = async (retryCount = 0): Promise<string> => {
    try {
      // Adiciona um parâmetro de cache-busting para evitar problemas de cache do navegador
      const cacheBuster = `?t=${Date.now()}`;
      const response = await fetch(`${src}${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      saveToCache(objectUrl, retryCount);
      return objectUrl;
    } catch (error) {
      if (retryCount < maxRetries) {
        const delay = Math.min(RETRY_DELAY * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return loadImage(retryCount + 1);
      }
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let currentObjectUrl: string | null = null;

    const loadImageWithCache = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Tenta pegar do cache primeiro
        const cachedUrl = getCachedImage();
        if (cachedUrl) {
          if (isMounted) {
            setImageUrl(cachedUrl);
            setIsLoading(false);
          }
          return;
        }

        // Se não estiver em cache, carrega a imagem
        const url = await loadImage();
        currentObjectUrl = url;
        
        if (isMounted) {
          setImageUrl(url);
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setError(error as Error);
          setIsLoading(false);
        }
      }
    };

    loadImageWithCache();

    return () => {
      isMounted = false;
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [src]);

  return {
    imageUrl,
    isLoading,
    error
  };
} 
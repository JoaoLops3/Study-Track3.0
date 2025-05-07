import { useState, useEffect } from 'react';

interface UseLazyImageProps {
  src: string;
  placeholder?: string;
  threshold?: number;
  maxRetries?: number;
}

interface UseLazyImageReturn {
  src: string;
  isLoaded: boolean;
  error: Error | null;
  retry: () => void;
}

// Cache global para imagens
const imageCache = new Map<string, string>();

export function useLazyImage({
  src,
  placeholder,
  threshold = 0.1,
  maxRetries = 3
}: UseLazyImageProps): UseLazyImageReturn {
  const [currentSrc, setCurrentSrc] = useState<string>(placeholder || src);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadImage = () => {
    // Se a imagem já está no cache, use-a
    if (imageCache.has(src)) {
      setCurrentSrc(imageCache.get(src)!);
      setIsLoaded(true);
      return;
    }

    const img = new Image();

    img.onload = () => {
      imageCache.set(src, src);
      setCurrentSrc(src);
      setIsLoaded(true);
      setError(null);
    };

    img.onerror = () => {
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadImage();
        }, 1000 * (retryCount + 1));
      } else {
        setError(new Error(`Failed to load image after ${maxRetries} retries`));
      }
    };

    img.src = src;
  };

  useEffect(() => {
    setIsLoaded(false);
    setError(null);
    setRetryCount(0);

    if (!src) {
      setError(new Error('No source provided'));
      return;
    }

    // Verifica se o navegador suporta Intersection Observer
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              observer.disconnect();
            }
          });
        },
        { threshold }
      );

      // Cria um elemento temporário para observar
      const element = document.createElement('div');
      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    } else {
      // Fallback para navegadores que não suportam Intersection Observer
      loadImage();
    }
  }, [src]);

  const retry = () => {
    if (error) {
      setRetryCount(0);
      setError(null);
      loadImage();
    }
  };

  return {
    src: currentSrc,
    isLoaded,
    error,
    retry
  };
} 
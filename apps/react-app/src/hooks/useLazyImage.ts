import { useState, useEffect } from 'react';

interface UseLazyImageProps {
  src: string;
  placeholder?: string;
  threshold?: number;
  maxRetries?: number;
}

// Cache para armazenar imagens já carregadas
const imageCache = new Map<string, string>();

export function useLazyImage({ 
  src, 
  placeholder, 
  threshold = 0.1,
  maxRetries = 3 
}: UseLazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentSrc, setCurrentSrc] = useState(placeholder || src);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Se a imagem já estiver em cache, use-a imediatamente
    if (imageCache.has(src)) {
      setCurrentSrc(imageCache.get(src)!);
      setIsLoaded(true);
      return;
    }

    const img = new Image();
    let isMounted = true;

    const loadImage = (url: string) => {
      return new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = (e) => reject(e);
        img.src = url;
      });
    };

    const observer = new IntersectionObserver(
      async (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            try {
              // Adiciona um timestamp para evitar cache do navegador
              const timestamp = Date.now();
              const urlWithTimestamp = `${src}${src.includes('?') ? '&' : '?'}_t=${timestamp}`;
              
              await loadImage(urlWithTimestamp);
              
              if (isMounted) {
                imageCache.set(src, src);
                setCurrentSrc(src);
                setIsLoaded(true);
                setError(null);
                setRetryCount(0);
              }
            } catch (e) {
              if (isMounted) {
                console.error('Erro ao carregar imagem:', e);
                
                if (retryCount < maxRetries) {
                  // Tenta novamente com um delay exponencial
                  const delay = Math.pow(2, retryCount) * 1000;
                  setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                  }, delay);
                } else {
                  setError(new Error('Falha ao carregar imagem após várias tentativas'));
                  if (placeholder) {
                    setCurrentSrc(placeholder);
                  }
                }
              }
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    const element = document.querySelector(`img[data-src="${src}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      isMounted = false;
      observer.disconnect();
    };
  }, [src, placeholder, threshold, retryCount, maxRetries]);

  return { src: currentSrc, isLoaded, error };
} 
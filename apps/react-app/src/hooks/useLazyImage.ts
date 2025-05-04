import { useState, useEffect } from 'react';

interface UseLazyImageProps {
  src: string;
  placeholder?: string;
  threshold?: number;
}

// Cache para armazenar imagens já carregadas
const imageCache = new Map<string, string>();

export function useLazyImage({ src, placeholder, threshold = 0.1 }: UseLazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentSrc, setCurrentSrc] = useState(placeholder || src);

  useEffect(() => {
    // Se a imagem já estiver em cache, use-a imediatamente
    if (imageCache.has(src)) {
      setCurrentSrc(imageCache.get(src)!);
      setIsLoaded(true);
      return;
    }

    const img = new Image();
    let isMounted = true;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Adiciona um timestamp para evitar cache do navegador
            const timestamp = Date.now();
            const urlWithTimestamp = `${src}${src.includes('?') ? '&' : '?'}_t=${timestamp}`;
            
            img.src = urlWithTimestamp;
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    img.onload = () => {
      if (isMounted) {
        // Armazena a imagem em cache
        imageCache.set(src, src);
        setCurrentSrc(src);
        setIsLoaded(true);
      }
    };

    img.onerror = (e) => {
      if (isMounted) {
        setError(new Error('Falha ao carregar imagem'));
        console.error('Erro ao carregar imagem:', e);
        // Se houver um placeholder, use-o em caso de erro
        if (placeholder) {
          setCurrentSrc(placeholder);
        }
      }
    };

    const element = document.querySelector(`img[data-src="${src}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      isMounted = false;
      observer.disconnect();
    };
  }, [src, placeholder, threshold]);

  return { src: currentSrc, isLoaded, error };
} 
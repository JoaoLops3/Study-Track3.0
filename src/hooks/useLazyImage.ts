import { useState, useEffect } from 'react';

interface UseLazyImageProps {
  src: string;
  placeholder?: string;
  threshold?: number;
}

export function useLazyImage({ src, placeholder, threshold = 0.1 }: UseLazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentSrc, setCurrentSrc] = useState(placeholder || src);

  useEffect(() => {
    const img = new Image();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.src = src;
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };

    img.onerror = (e) => {
      setError(new Error('Failed to load image'));
      console.error('Error loading image:', e);
    };

    const element = document.querySelector(`img[data-src="${src}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, threshold]);

  return { src: currentSrc, isLoaded, error };
} 
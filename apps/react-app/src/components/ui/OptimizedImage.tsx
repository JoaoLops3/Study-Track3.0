import { useState, useEffect } from "react";
import { useLazyImage } from "../../hooks/useLazyImage";
import { Loading } from "./Loading";

interface OptimizedImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

// Cache para armazenar URLs de imagens já carregadas
const imageCache = new Map<string, string>();

export function OptimizedImage({
  src,
  alt,
  placeholder,
  className = "",
  width,
  height,
  priority = false,
  onError,
}: OptimizedImageProps) {
  const [isError, setIsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryDelay = 1000; // 1 segundo

  const {
    src: currentSrc,
    isLoaded,
    error,
  } = useLazyImage({
    src: imageCache.get(src) || src,
    placeholder,
    threshold: priority ? 1 : 0.1,
  });

  useEffect(() => {
    if (error && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        // Tenta carregar a imagem novamente
        const img = new Image();
        img.src = src;
        img.onload = () => {
          imageCache.set(src, src);
          setIsError(false);
        };
      }, retryDelay * (retryCount + 1));

      return () => clearTimeout(timer);
    }
  }, [error, retryCount, src]);

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    if (onError) {
      onError(e);
    }
    if (retryCount >= maxRetries) {
      setIsError(true);
    }
  };

  if (error || isError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 dark:text-gray-500">
          Imagem não disponível
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Loading size="sm" />
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        onError={handleImageError}
        data-src={src}
      />
    </div>
  );
}

import { useState } from 'react';
import { useLazyImage } from '../../hooks/useLazyImage';
import { Loading } from './Loading';

interface OptimizedImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  placeholder,
  className = '',
  width,
  height,
  priority = false,
}: OptimizedImageProps) {
  const [isError, setIsError] = useState(false);
  const { src: currentSrc, isLoaded, error } = useLazyImage({
    src,
    placeholder,
    threshold: priority ? 1 : 0.1,
  });

  if (error || isError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 dark:text-gray-500">Imagem não disponível</span>
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
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setIsError(true)}
        data-src={src}
      />
    </div>
  );
} 
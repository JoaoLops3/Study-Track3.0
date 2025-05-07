import React, { useState } from "react";
import { useGoogleImage } from "../../hooks/useGoogleImage";
import { Loading } from "./Loading";

interface GoogleImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
}

export function GoogleImage({
  src,
  alt,
  className = "",
  width,
  height,
  fallbackSrc = "/images/default-avatar.png",
}: GoogleImageProps) {
  const [hasError, setHasError] = useState(false);
  const { imageUrl, isLoading, error } = useGoogleImage({
    src,
    maxRetries: 3,
    cacheTime: 24 * 60 * 60 * 1000, // 24 horas
  });

  const handleError = () => {
    setHasError(true);
  };

  if (error || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height }}
      >
        <img
          src={fallbackSrc}
          alt={alt}
          className="h-full w-full object-cover"
          width={width}
          height={height}
          onError={() => {
            // Se o fallback também falhar, tenta usar o fallback padrão do sistema
            const img = document.querySelector("img");
            if (img) {
              img.src = "/images/default-avatar.png";
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Loading size="sm" />
        </div>
      )}
      <img
        src={imageUrl || fallbackSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        width={width}
        height={height}
        loading="lazy"
        onError={handleError}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import defaultAvatar from '/images/avatar.png';
import { OptimizedImage } from './OptimizedImage';

interface AvatarProps {
  className?: string;
  alt?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  className = '', 
  alt = 'Avatar'
}) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>(defaultAvatar);
  const [imageError, setImageError] = useState<boolean>(false);

  const isValidImageUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      // Primeiro tenta usar o avatar personalizado
      if (user.user_metadata?.custom_avatar_url && isValidImageUrl(user.user_metadata.custom_avatar_url)) {
        setAvatarUrl(user.user_metadata.custom_avatar_url);
        setImageError(false);
      }
      // Se não tiver avatar personalizado e tiver avatar_url nos metadados, usa ele
      else if (user.user_metadata?.avatar_url && isValidImageUrl(user.user_metadata.avatar_url)) {
        setAvatarUrl(user.user_metadata.avatar_url);
        setImageError(false);
      }
      // Se tiver picture nos metadados (caso do Google), usa ele
      else if (user.user_metadata?.picture && isValidImageUrl(user.user_metadata.picture)) {
        setAvatarUrl(user.user_metadata.picture);
        setImageError(false);
      }
      // Caso contrário, usa o avatar padrão
      else {
        setAvatarUrl(defaultAvatar);
        setImageError(false);
      }
    } else {
      setAvatarUrl(defaultAvatar);
      setImageError(false);
    }
  }, [user?.user_metadata]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Erro ao carregar imagem:', e);
    console.log('URL que falhou:', avatarUrl);
    if (!imageError) {
      setImageError(true);
      setAvatarUrl(defaultAvatar);
    }
  };

  return (
    <div className={`relative w-8 h-8 rounded-full overflow-hidden ${className}`}>
      <OptimizedImage
        src={avatarUrl}
        alt={alt}
        className="h-full w-full object-cover"
        width={32}
        height={32}
        priority={true}
        onError={handleImageError}
      />
    </div>
  );
}; 
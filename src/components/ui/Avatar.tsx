import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import defaultAvatar from '/images/avatar.png';

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
      console.log('User metadata:', user.user_metadata);
      console.log('App metadata:', user.app_metadata);

      // Primeiro tenta usar o avatar personalizado
      if (user.user_metadata?.custom_avatar_url && isValidImageUrl(user.user_metadata.custom_avatar_url)) {
        console.log('Usando avatar personalizado:', user.user_metadata.custom_avatar_url);
        setAvatarUrl(user.user_metadata.custom_avatar_url);
        setImageError(false);
      }
      // Se não tiver avatar personalizado e tiver avatar_url nos metadados, usa ele
      else if (user.user_metadata?.avatar_url && isValidImageUrl(user.user_metadata.avatar_url)) {
        console.log('Usando avatar dos metadados:', user.user_metadata.avatar_url);
        setAvatarUrl(user.user_metadata.avatar_url);
        setImageError(false);
      }
      // Caso contrário, usa o avatar padrão
      else {
        console.log('Usando avatar padrão');
        setAvatarUrl(defaultAvatar);
        setImageError(false);
      }
    } else {
      console.log('Nenhum usuário logado, usando avatar padrão');
      setAvatarUrl(defaultAvatar);
      setImageError(false);
    }
  }, [user?.user_metadata, user?.app_metadata]);

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
      <img 
        src={avatarUrl} 
        alt={alt}
        className="h-full w-full object-cover"
        onError={handleImageError}
        loading="lazy"
        crossOrigin="anonymous"
      />
    </div>
  );
}; 
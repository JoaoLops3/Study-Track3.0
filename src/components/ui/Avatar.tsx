import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
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

  useEffect(() => {
    if (user) {
      console.log('User metadata:', user.user_metadata);
      console.log('App metadata:', user.app_metadata);

      // Primeiro tenta usar o avatar personalizado
      if (user.user_metadata?.custom_avatar_url) {
        console.log('Usando avatar personalizado:', user.user_metadata.custom_avatar_url);
        setAvatarUrl(user.user_metadata.custom_avatar_url);
      }
      // Se não tiver avatar personalizado e for usuário do Google, usa a foto do Google
      else if (user.app_metadata?.provider === 'google' && user.user_metadata?.avatar_url) {
        console.log('Usando avatar do Google:', user.user_metadata.avatar_url);
        setAvatarUrl(user.user_metadata.avatar_url);
      }
      // Caso contrário, usa o avatar padrão
      else {
        console.log('Usando avatar padrão');
        setAvatarUrl(defaultAvatar);
      }
    } else {
      console.log('Nenhum usuário logado, usando avatar padrão');
      setAvatarUrl(defaultAvatar);
    }
  }, [user?.user_metadata, user?.app_metadata]); // Adicionando dependências específicas

  return (
    <div className={`relative w-8 h-8 rounded-full overflow-hidden ${className}`}>
      <img 
        src={avatarUrl} 
        alt={alt}
        className="h-full w-full object-cover"
        onError={(e) => {
          console.error('Erro ao carregar imagem:', e);
          setAvatarUrl(defaultAvatar);
        }}
      />
    </div>
  );
}; 
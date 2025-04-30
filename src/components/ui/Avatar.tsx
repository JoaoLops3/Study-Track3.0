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
  const { user, updateUserAvatar, removeUserAvatar } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    if (user) {
      // Verifica se é um usuário do Google
      const isGoogle = user.app_metadata?.provider === 'google';
      setIsGoogleUser(isGoogle);

      // Se for usuário do Google, usa a foto do Google
      if (isGoogle && user.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      } else {
        // Se não for Google ou não tiver foto do Google, usa a foto personalizada ou default
        setAvatarUrl(user.user_metadata?.custom_avatar_url || defaultAvatar);
      }
    } else {
      setAvatarUrl(defaultAvatar);
      setIsGoogleUser(false);
    }
  }, [user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { error } = await updateUserAvatar(file);
      if (error) throw error;

      // Atualiza a URL da imagem localmente
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  const handleRemoveImage = async () => {
    try {
      const { error } = await removeUserAvatar();
      if (error) throw error;

      if (isGoogleUser && user?.user_metadata?.avatar_url) {
        // Se for usuário do Google, volta para a foto do Google
        setAvatarUrl(user.user_metadata.avatar_url);
      } else {
        // Se não for usuário do Google, volta para a foto padrão
        setAvatarUrl(defaultAvatar);
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
    }
  };

  return (
    <div className="relative group w-8 h-8 rounded-full overflow-hidden">
      <img 
        src={avatarUrl || defaultAvatar} 
        alt={alt} 
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <label className="cursor-pointer p-1 bg-black/50 rounded-full">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </label>
        {avatarUrl !== user?.user_metadata?.avatar_url && (
          <div
            onClick={handleRemoveImage}
            className="ml-2 p-1 bg-black/50 rounded-full cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}; 
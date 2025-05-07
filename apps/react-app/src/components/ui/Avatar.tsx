import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import defaultAvatar from "/images/avatar.png";
import { GoogleImage } from "./GoogleImage";

interface AvatarProps {
  className?: string;
  alt?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  className = "",
  alt = "Avatar",
}) => {
  const { user } = useAuth();

  const getAvatarUrl = () => {
    if (!user) return defaultAvatar;

    // Prioridade de fontes de avatar
    if (user.user_metadata?.custom_avatar_url) {
      return user.user_metadata.custom_avatar_url;
    }
    if (user.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    if (user.user_metadata?.picture) {
      return user.user_metadata.picture;
    }

    return defaultAvatar;
  };

  const isGoogleImage = (url: string) => {
    return url.includes("googleusercontent.com");
  };

  const avatarUrl = getAvatarUrl();

  if (isGoogleImage(avatarUrl)) {
    return (
      <div
        className={`relative w-8 h-8 rounded-full overflow-hidden ${className}`}
      >
        <GoogleImage
          src={avatarUrl}
          alt={alt}
          className="h-full w-full object-cover"
          width={32}
          height={32}
          fallbackSrc={defaultAvatar}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-8 h-8 rounded-full overflow-hidden ${className}`}
    >
      <img
        src={avatarUrl}
        alt={alt}
        className="h-full w-full object-cover"
        width={32}
        height={32}
      />
    </div>
  );
};

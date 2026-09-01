import React from 'react';
import { Player } from '../types';
import { 
  Zap, 
  Star, 
  Shield, 
  Flame, 
  Target, 
  Crown, 
  Trophy, 
  Medal, 
  Compass, 
  Heart, 
  Sparkles, 
  CircleDot, 
  User 
} from 'lucide-react';
import { getDeterministicAvatar, AVATAR_COLORS } from '../utils/avatarUtils';

interface PlayerAvatarProps {
  player?: Partial<Player> | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  onClick?: () => void;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  name,
  size = 'md',
  className = '',
  showBorder = true,
  onClick,
}) => {
  const playerName = player?.name || name || 'Joueur';
  const defaultInfo = getDeterministicAvatar(player || { name: playerName });

  const avatarType = player?.avatarType || 'icon';
  const avatarColor = player?.avatarColor || defaultInfo.color.bg;
  const avatarIcon = player?.avatarIcon || defaultInfo.icon.id;
  const avatarUrl = player?.avatarUrl;

  // Size mapping
  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const iconSizeClasses = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const renderIcon = (iconId: string) => {
    const iconProps = { className: `${iconSizeClasses[size]} stroke-[2.2]` };
    switch (iconId) {
      case 'zap':
        return <Zap {...iconProps} />;
      case 'star':
        return <Star {...iconProps} className={`${iconSizeClasses[size]} fill-current`} />;
      case 'shield':
        return <Shield {...iconProps} />;
      case 'flame':
        return <Flame {...iconProps} />;
      case 'target':
        return <Target {...iconProps} />;
      case 'crown':
        return <Crown {...iconProps} />;
      case 'trophy':
        return <Trophy {...iconProps} />;
      case 'medal':
        return <Medal {...iconProps} />;
      case 'compass':
        return <Compass {...iconProps} />;
      case 'heart':
        return <Heart {...iconProps} className={`${iconSizeClasses[size]} fill-current`} />;
      case 'sparkles':
        return <Sparkles {...iconProps} />;
      case 'foot':
      default:
        return <CircleDot {...iconProps} />;
    }
  };

  // Extract initials
  const initials = playerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || '?';

  // If photo / preset URL exists
  if (avatarUrl && (avatarType === 'photo' || avatarType === 'preset' || avatarType === 'icon')) {
    return (
      <div
        onClick={onClick}
        className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden select-none transition-transform ${
          onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        } ${sizeClasses[size]} ${
          showBorder ? 'ring-2 ring-white shadow-xs' : ''
        } ${className}`}
        style={{ backgroundColor: avatarColor }}
        title={`${playerName} (Cliquez pour modifier l'avatar)`}
      >
        <img
          src={avatarUrl}
          alt={playerName}
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // If initials mode explicitly or icon mode
  if (avatarType === 'initials') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center shrink-0 rounded-full font-black text-white select-none transition-transform ${
          onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        } ${sizeClasses[size]} ${
          showBorder ? 'ring-2 ring-white shadow-xs' : ''
        } ${className}`}
        style={{ backgroundColor: avatarColor }}
        title={`${playerName} (Cliquez pour modifier l'avatar)`}
      >
        <span>{player?.number !== undefined ? player.number : initials}</span>
      </div>
    );
  }

  // Default Icon + Color mode
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center shrink-0 rounded-full text-white select-none transition-transform ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${sizeClasses[size]} ${
        showBorder ? 'ring-2 ring-white shadow-xs' : ''
      } ${className}`}
      style={{ backgroundColor: avatarColor }}
      title={`${playerName} (Cliquez pour modifier l'avatar)`}
    >
      {renderIcon(avatarIcon)}
    </div>
  );
};

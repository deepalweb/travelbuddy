import React from 'react';
import { Award, Star, Shield, Crown } from './Icons.tsx';

interface UserReputationBadgeProps {
  level: 'new' | 'trusted' | 'expert' | 'moderator';
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

const UserReputationBadge: React.FC<UserReputationBadgeProps> = ({
  level,
  score,
  size = 'md',
  showScore = false
}) => {
  const getBadgeConfig = () => {
    switch (level) {
      case 'new':
        return {
          icon: Star,
          color: 'text-gray-500',
          bg: 'bg-gray-100',
          label: 'New Traveler'
        };
      case 'trusted':
        return {
          icon: Award,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          label: 'Trusted Member'
        };
      case 'expert':
        return {
          icon: Shield,
          color: 'text-green-600',
          bg: 'bg-green-100',
          label: 'Travel Expert'
        };
      case 'moderator':
        return {
          icon: Crown,
          color: 'text-purple-600',
          bg: 'bg-purple-100',
          label: 'Community Moderator'
        };
      default:
        return {
          icon: Star,
          color: 'text-gray-500',
          bg: 'bg-gray-100',
          label: 'Member'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 12,
          text: 'text-xs'
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 20,
          text: 'text-base'
        };
      default:
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 16,
          text: 'text-sm'
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses = getSizeClasses();
  const IconComponent = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.color} ${sizeClasses.container}`}
      title={`${config.label}${showScore ? ` (${score} points)` : ''}`}
    >
      <IconComponent size={sizeClasses.icon} />
      <span className={sizeClasses.text}>
        {config.label}
        {showScore && ` (${score})`}
      </span>
    </div>
  );
};

export default UserReputationBadge;
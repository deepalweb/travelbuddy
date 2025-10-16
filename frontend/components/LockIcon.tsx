

import React from 'react';
import { Colors } from '../constants.ts';

interface LockIconProps {
  className?: string;
  color?: string; 
}

const LockIcon: React.FC<LockIconProps> = ({ className = "w-5 h-5", color = Colors.lock }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      fill="none" 
      viewBox="0 0 24 24" 
      stroke={color} 
      strokeWidth="2"
      aria-hidden="true" // Decorative icon
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
      />
    </svg>
  );
};

export default LockIcon;



import React from 'react';

const PlaceCardSkeleton: React.FC = () => {
  return (
    <div 
      className="rounded-xl overflow-hidden flex flex-col card-base"
      aria-hidden="true"
    >
      <div className="w-full h-44 shimmer-bg"></div> 
      <div className="p-4 flex flex-col flex-grow"> 
        <div className="h-5 w-3/4 mb-2 rounded shimmer-bg"></div> 
        <div className="h-3.5 w-1/2 mb-1.5 rounded shimmer-bg"></div> 
        <div className="h-3.5 w-1/3 mb-3 rounded shimmer-bg"></div> 
        <div className="h-3 w-full mb-1.5 rounded shimmer-bg"></div> 
        <div className="h-3 w-full mb-1.5 rounded shimmer-bg"></div> 
        <div className="h-3 w-3/4 mb-3 rounded shimmer-bg"></div> 
        <div className="mt-auto pt-3 border-t flex flex-col gap-2.5" style={{borderColor: 'var(--color-card-border)'}}> 
           <div className="w-full h-9 rounded-lg shimmer-bg"></div> 
           <div className="w-full h-8 rounded-lg mt-1.5 shimmer-bg"></div> 
        </div>
      </div>
    </div>
  );
};

export default PlaceCardSkeleton;
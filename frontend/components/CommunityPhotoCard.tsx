
import React from 'react';
import { CommunityPhoto } from '../types.ts';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface CommunityPhotoCardProps {
  photo: CommunityPhoto;
  onLikePhoto: (photoId: string) => void;
  style?: React.CSSProperties;
}

const CommunityPhotoCard: React.FC<CommunityPhotoCardProps> = ({ photo, onLikePhoto, style }) => {
  const { t } = useLanguage();

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300 group animate-fadeInUp"
      style={{
        backgroundColor: Colors.cardBackground,
        boxShadow: Colors.boxShadow,
        transform: 'translateZ(0)',
        ...style,
      }}
      aria-labelledby={`photo-caption-${photo.id}`}
    >
      <img
        src={photo.imageUrl}
        alt={photo.caption || t('communityGallery.title') + ' ' + photo.id}
        loading="lazy"
        className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/600/400?grayscale&blur=1'; }}
      />
      <div className="p-4 flex flex-col flex-grow">
        {photo.caption && (
          <p id={`photo-caption-${photo.id}`} className="text-sm mb-2 flex-grow" style={{ color: Colors.text_secondary }}>
            {photo.caption}
          </p>
        )}
        <p className="text-xs mb-3" style={{ color: Colors.text_secondary }}>
          {t('communityGallery.byUser', { username: photo.uploaderName })} - <time dateTime={photo.uploadedAt}>{new Date(photo.uploadedAt).toLocaleDateString()}</time>
        </p>
        <div className="mt-auto flex justify-between items-center">
          <span className="text-sm font-medium" style={{ color: Colors.text_secondary }}>
            {t('communityGallery.likes', { count: photo.likes.toString() })}
          </span>
          <button
            onClick={() => onLikePhoto(photo.id)}
            className="px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-opacity-70"
            style={{
              color: Colors.primaryGradientEnd,
              backgroundColor: Colors.cardBackground,
              boxShadow: Colors.boxShadowSoft,
              borderColor: Colors.primaryGradientEnd,
            }}
            aria-label={`${t('communityGallery.photoLiked')} ${photo.caption || 'photo'}`}
          >
            ❤️ {t('communityGallery.photoLiked').split(' ')[0]} {/* Using first word of "Photo liked!" for "Like" */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CommunityPhotoCard);

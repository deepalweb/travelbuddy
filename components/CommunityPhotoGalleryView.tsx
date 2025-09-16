

import React from 'react';
import { CommunityPhoto } from '../types.ts';
import { Colors } from '../constants.ts';
import CommunityPhotoCard from './CommunityPhotoCard.tsx';
import CommunityPhotoCardSkeleton from './CommunityPhotoCardSkeleton.tsx';
import ErrorDisplay from './ErrorDisplay.tsx';
import LockIcon from './LockIcon.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface CommunityPhotoGalleryViewProps {
  photos: CommunityPhoto[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onUploadPhoto: () => void;
  onLikePhoto: (photoId: string) => void;
  canUpload: boolean;
}

const CommunityPhotoGalleryView: React.FC<CommunityPhotoGalleryViewProps> = ({
  photos,
  isLoading,
  error,
  onRetry,
  onUploadPhoto,
  onLikePhoto,
  canUpload,
}) => {
  const { t } = useLanguage();

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, index) => <CommunityPhotoCardSkeleton key={index} />)}
    </div>
  );

  return (
    <div className="py-5 rounded-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-center sm:text-left" style={{ color: Colors.text }}>
          {t('communityGallery.title')}
        </h2>
        <button
          onClick={onUploadPhoto}
          disabled={!canUpload}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-opacity-70 disabled:opacity-70 flex items-center justify-center relative"
          style={{
            color: 'white',
            backgroundImage: `linear-gradient(145deg, ${Colors.primaryGradientEnd}, ${Colors.primary})`,
            boxShadow: Colors.boxShadowButton,
            borderColor: Colors.primary,
          }}
          aria-label={t('communityGallery.uploadPhoto')}
        >
          {!canUpload && <LockIcon className="w-4 h-4 mr-2" />}
          {t('communityGallery.uploadPhoto')}
        </button>
      </div>

      {error && <ErrorDisplay message={error} onRetry={onRetry} />}
      
      {!error && isLoading && renderSkeletons()}
      
      {!error && !isLoading && photos.length === 0 && (
        <div className="text-center py-16 px-6 rounded-2xl" style={{ backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 mb-4" style={{ color: Colors.text_secondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-xl font-semibold mb-2" style={{ color: Colors.text }}>{t('communityGallery.noPhotosYet')}</p>
        </div>
      )}

      {!error && !isLoading && photos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {photos.map((photo, index) => (
            <CommunityPhotoCard
              key={photo.id}
              photo={photo}
              onLikePhoto={onLikePhoto}
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityPhotoGalleryView;

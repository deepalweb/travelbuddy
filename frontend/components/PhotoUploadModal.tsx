

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Colors } from '../constants.ts';
import { CommunityPhotoUploadData } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (uploadData: CommunityPhotoUploadData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isLoading,
  error: uploadError,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [internalError, setInternalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Reset form on open
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      setInternalError(null);
    }
  }, [isOpen]);

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCloseWithAnimation();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleCloseWithAnimation]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInternalError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setInternalError(t('communityGallery.fileTooLargeError', { fileName: file.name }));
        setSelectedFile(null);
        setPreviewUrl(null);
        addToast({ message: t('communityGallery.fileTooLargeError', { fileName: file.name }), type: 'warning' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setInternalError(t('communityGallery.invalidFileType', { fileName: file.name }));
        setSelectedFile(null);
        setPreviewUrl(null);
        addToast({ message: t('communityGallery.invalidFileType', { fileName: file.name }), type: 'warning' });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !previewUrl) {
      setInternalError(t('communityGallery.selectImage'));
      addToast({ message: t('communityGallery.selectImage'), type: 'warning' });
      return;
    }
    setInternalError(null);
    const uploadData: CommunityPhotoUploadData = {
      imageDataUrl: previewUrl,
      caption: caption.trim() || undefined,
    };
    await onUpload(uploadData);
    // Modal closure is handled by App.tsx if upload is successful
  };
  
  const commonButtonStyles: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    fontWeight: '600',
    transition: 'all 0.2s ease-in-out',
    boxShadow: Colors.boxShadowButton,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // width: '100%', // Removed for auto width
  };
  
  const primaryButtonStyle: React.CSSProperties = {
    ...commonButtonStyles,
    backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`,
    color: 'white',
  };

  const inputStyle: React.CSSProperties = {
    color: Colors.text,
    backgroundColor: Colors.inputBackground,
    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.03)',
    borderColor: Colors.cardBorder,
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    width: '100%',
    transition: 'border-color 0.2s ease-in-out',
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
      onClick={handleCloseWithAnimation}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-photo-modal-title"
    >
      <div
        className={`rounded-2xl shadow-2xl overflow-hidden w-full sm:max-w-md max-h-[90vh] flex flex-col relative transform transition-all duration-300 ease-out ${isVisible && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{ backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b" style={{ borderColor: Colors.cardBorder }}>
          <h2 id="upload-photo-modal-title" className="text-xl sm:text-2xl font-bold" style={{ color: Colors.text }}>
            {t('communityGallery.uploadPhoto')}
          </h2>
          <button
            onClick={handleCloseWithAnimation}
            className="p-2 rounded-full transition-colors focus:outline-none focus:ring-2"
            style={{ backgroundColor: Colors.cardBackground, color: Colors.text_secondary, boxShadow: Colors.boxShadowSoft, borderColor: Colors.primary }}
            aria-label={`${t('close')} ${t('communityGallery.uploadPhoto')}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium mb-1" style={{ color: Colors.text_secondary }}>
              {t('communityGallery.selectImage')} (Max 5MB)
            </label>
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{...commonButtonStyles, backgroundColor: Colors.cardBackground, color: Colors.primary, border: `1px solid ${Colors.primary}`, width:'auto', padding: '0.625rem 1.25rem'}}
              className="text-sm focus:ring-blue-400/70 active:scale-95"
            >
              {previewUrl ? t('communityGallery.changeImage') : t('communityGallery.selectImage')}
            </button>
            {selectedFile && <p className="text-xs mt-1.5" style={{color: Colors.text_secondary}}>{selectedFile.name}</p>}
          </div>

          {previewUrl && (
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: Colors.text_secondary }}>{t('communityGallery.imagePreview')}</p>
              <img src={previewUrl} alt={t('communityGallery.imagePreview')} className="max-h-48 w-auto rounded-lg object-contain mx-auto" style={{border: `1px solid ${Colors.cardBorder}`}} />
            </div>
          )}

          <div>
            <label htmlFor="caption" className="block text-sm font-medium mb-1" style={{ color: Colors.text_secondary }}>
              {t('communityGallery.captionPlaceholder')}
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t('communityGallery.captionPlaceholder')}
              rows={3}
              style={inputStyle}
              className={`focus:ring-2 focus:ring-[${Colors.primary}]`}
              maxLength={200}
            />
             <p className="text-xs text-right mt-1" style={{color: Colors.text_secondary}}>{caption.length}/200</p>
          </div>
          
          {(internalError || uploadError) && (
            <div className="p-3 my-1 rounded-lg text-sm" style={{ backgroundColor: `${Colors.accentError}20`, border: `1px solid ${Colors.accentError}60`, color: Colors.accentError }} role="alert">
              <p><span className="font-semibold">{t('modals.errorPrefix')}</span> {internalError || uploadError}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 items-center">
            <button
              type="button"
              onClick={handleCloseWithAnimation}
              style={{...commonButtonStyles, backgroundColor: Colors.cardBackground, color: Colors.text_secondary, border: `1px solid ${Colors.text_secondary}50`, width: '100%'}}
              className="sm:w-auto focus:ring-gray-400/70 active:scale-98"
              disabled={isLoading}
            >
                {t('placeDetailModal.cancelButton')}
            </button>
            <button
              type="submit"
              style={{ ...primaryButtonStyle, width: '100%'}}
              className="sm:w-auto focus:ring-blue-500/70 active:scale-98 disabled:opacity-70"
              disabled={isLoading || !selectedFile}
            >
              {isLoading ? t('communityGallery.uploading') : t('communityGallery.uploadNowButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhotoUploadModal;

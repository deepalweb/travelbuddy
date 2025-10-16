import React, { useState, useEffect, useCallback } from 'react';
import { Post } from '../types.ts';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { Link, TwitterX, WhatsApp, Mail } from './Icons.tsx';

interface ShareModalProps {
  post: Post | null;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ post, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();
  const { addToast } = useToast();
  
  const postUrl = post ? `${window.location.origin}/post/${post.id}` : '';
  const shareText = post ? `Check out this post from ${post.author.name} on Travel Buddy: ${post.content.text.slice(0, 100)}...` : '';

  useEffect(() => {
    if (post) {
      setIsVisible(true);
    }
  }, [post]);

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl).then(() => {
      addToast({ message: t('shareModal.linkCopiedSuccess'), type: 'success' });
    }).catch(() => {
      addToast({ message: t('shareModal.linkCopiedError'), type: 'error' });
    });
  };

  const shareOptions = [
    { name: t('shareModal.copyLink'), icon: <Link />, action: handleCopyLink },
    { name: t('shareModal.shareOnX'), icon: <TwitterX />, action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`, '_blank') },
    { name: t('shareModal.shareOnWhatsApp'), icon: <WhatsApp />, action: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + postUrl)}`, '_blank') },
    { name: t('shareModal.shareByEmail'), icon: <Mail />, action: () => window.location.href = `mailto:?subject=Check out this post from Travel Buddy&body=${encodeURIComponent(shareText + '\n\n' + postUrl)}` },
  ];
  
  if (!post) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(8px)' }}      
      onClick={handleCloseWithAnimation}
      role="dialog" aria-modal="true" aria-labelledby="share-modal-title"
    >
      <div 
        className={`card-base w-full max-w-sm transform transition-all duration-300 ease-out ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b" style={{borderColor: 'var(--color-glass-border)'}}>
            <h3 id="share-modal-title" className="text-lg font-semibold text-center">{t('shareModal.title')}</h3>
        </div>
        <div className="p-4">
           <div className="grid grid-cols-2 gap-4">
                {shareOptions.map(opt => (
                    <button key={opt.name} onClick={opt.action} className="flex flex-col items-center justify-center p-4 rounded-lg text-center transition-colors hover:bg-gray-100/50 dark:hover:bg-white/10">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full mb-2" style={{backgroundColor: 'var(--color-input-bg)'}}>
                            {React.cloneElement(opt.icon as React.ReactElement, { style: { color: 'var(--color-primary)' } })}
                        </div>
                        <span className="text-xs font-medium">{opt.name}</span>
                    </button>
                ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
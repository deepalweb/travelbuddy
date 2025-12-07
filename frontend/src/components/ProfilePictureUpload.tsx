import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, User } from 'lucide-react';
import { configService } from '../services/configService';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePictureUploadProps {
  currentPicture?: string | null;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  onUploadProgress?: (progress: number) => void;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentPicture,
  onUploadSuccess,
  onUploadError,
  onUploadProgress
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onUploadError?.('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      onUploadError?.('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);
    onUploadProgress?.(0);
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const token = localStorage.getItem('demo_token') || localStorage.getItem('token');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Get user ID from context or localStorage
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      // Simulate progress for better UX (real progress requires XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const config = await configService.getConfig();
      const uploadUrl = `${config.apiBaseUrl}/api/upload/profile-picture`;
      console.log('📤 Uploading to:', uploadUrl, { userId: user?.id, hasToken: !!token });
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData
      });
      
      console.log('📥 Upload response:', response.status, response.statusText);

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      if (data.success) {
        onUploadSuccess?.(data.profilePicture);
        setPreview(null);
        setProgress(0);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      onUploadError?.(errorMessage);
      setPreview(null);
      setProgress(0);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayImage = preview || currentPicture;

  return (
    <div className="relative group">
      <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30 shadow-2xl overflow-hidden">
        {displayImage ? (
          <img 
            src={displayImage} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-20 h-20 text-white" />
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center rounded-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
            {progress > 0 && (
              <div className="text-white text-xs font-semibold">{progress}%</div>
            )}
          </div>
        )}
      </div>
      
      <button
        onClick={handleClick}
        disabled={uploading}
        className="absolute bottom-3 right-3 w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 group-hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Upload profile picture"
      >
        {uploading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        ) : (
          <Camera className="w-6 h-6" />
        )}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePictureUpload;

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, User, AlertCircle, Loader2 } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setSuccess(false);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'File size must be less than 5MB';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      setTimeout(() => setError(null), 5000);
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

      const token = localStorage.getItem('token') || localStorage.getItem('demo_token');
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
        setSuccess(true);
        onUploadSuccess?.(data.profilePicture);
        setTimeout(() => {
          setPreview(null);
          setProgress(0);
          setSuccess(false);
        }, 2000);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      setError(errorMessage);
      onUploadError?.(errorMessage);
      setPreview(null);
      setProgress(0);
      setTimeout(() => setError(null), 5000);
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
        
        {/* Upload Progress Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-full">
            <Loader2 className="w-10 h-10 text-white animate-spin mb-2" />
            {progress > 0 && (
              <div className="text-white text-sm font-bold">{progress}%</div>
            )}
            <div className="w-24 h-1 bg-white/30 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center rounded-full animate-in fade-in duration-300">
            <Check className="w-12 h-12 text-white mb-1" />
            <span className="text-white text-sm font-semibold">Uploaded!</span>
          </div>
        )}
      </div>
      
      <button
        onClick={handleClick}
        disabled={uploading || success}
        className="absolute bottom-3 right-3 w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 group-hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Upload profile picture"
      >
        {success ? (
          <Check className="w-6 h-6 text-green-600" />
        ) : uploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
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
      
      {/* Error Message */}
      {error && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 bg-red-500 text-white text-xs py-2 px-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-bottom-2 duration-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Success Message */}
      {success && !error && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 bg-green-500 text-white text-xs py-2 px-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-bottom-2 duration-300">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>Profile picture updated successfully!</span>
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';

interface PhotoUploadProps {
  onPhotosSelected: (photos: File[]) => void;
  maxPhotos?: number;
  existingPhotos?: string[];
}

export const MobilePhotoUpload: React.FC<PhotoUploadProps> = ({
  onPhotosSelected,
  maxPhotos = 5,
  existingPhotos = []
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(existingPhotos);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, maxPhotos - selectedPhotos.length);
    const newPhotos = [...selectedPhotos, ...newFiles];
    
    // Create preview URLs
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    const allPreviewUrls = [...previewUrls, ...newPreviewUrls];
    
    setSelectedPhotos(newPhotos);
    setPreviewUrls(allPreviewUrls);
    onPhotosSelected(newPhotos);
  };

  const removePhoto = (index: number) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke object URL to prevent memory leaks
    if (previewUrls[index] && !existingPhotos.includes(previewUrls[index])) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    setSelectedPhotos(newPhotos);
    setPreviewUrls(newPreviewUrls);
    onPhotosSelected(newPhotos);
  };

  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const openGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const canAddMore = selectedPhotos.length + existingPhotos.length < maxPhotos;

  return (
    <div className="space-y-4">
      {/* Photo Grid */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Options */}
      {canAddMore && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Camera Button */}
            <button
              onClick={openCamera}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Camera className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Take Photo</span>
            </button>

            {/* Gallery Button */}
            <button
              onClick={openGallery}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Choose from Gallery</span>
            </button>
          </div>

          {/* Photo Counter */}
          <div className="text-center text-sm text-gray-500">
            {selectedPhotos.length + existingPhotos.length} of {maxPhotos} photos
          </div>
        </div>
      )}

      {/* Maximum Reached Message */}
      {!canAddMore && (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-sm text-yellow-700">
            Maximum of {maxPhotos} photos reached
          </span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Drag and Drop Area (Desktop) */}
      <div
        className="hidden md:block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
        onDrop={(e) => {
          e.preventDefault();
          handleFileSelect(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        onClick={openGallery}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-600 mb-2">
          Drop photos here or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Supports JPG, PNG, GIF up to 10MB each
        </p>
      </div>
    </div>
  );
};
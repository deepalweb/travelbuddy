import React, { useState, useRef } from 'react';

interface ImageUploadWidgetProps {
  label: string;
  onImageSelect: (file: File) => void;
  currentImage?: string;
  accept?: string;
}

const ImageUploadWidget: React.FC<ImageUploadWidgetProps> = ({
  label,
  onImageSelect,
  currentImage,
  accept = "image/*"
}) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div
        onClick={handleClick}
        className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-lg" />
        ) : (
          <div className="text-center">
            <div className="text-gray-400 mb-2">📷</div>
            <div className="text-sm text-gray-500">Click to upload image</div>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploadWidget;
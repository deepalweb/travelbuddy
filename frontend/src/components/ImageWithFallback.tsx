import React, { useState, ImgHTMLAttributes } from 'react'

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  fallbackSrc?: string
  alt: string
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc = 'https://via.placeholder.com/600x400?text=Image+Not+Available',
  alt,
  loading = 'lazy',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setImgSrc(fallbackSrc)
      setHasError(true)
    }
  }

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      loading={loading}
      onError={handleError}
    />
  )
}

import React, { useEffect, useState, ImgHTMLAttributes } from 'react'

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  fallbackSrc?: string
  alt: string
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#eef2f7" />
      <circle cx="600" cy="270" r="88" fill="#64748b" opacity="0.12" />
      <text x="600" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#475569" font-weight="700">Image</text>
      <text x="600" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" fill="#334155" font-weight="700">Unavailable</text>
      <text x="600" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#64748b">No verified image was available for this stop.</text>
    </svg>
  `)}`,
  alt,
  loading = 'lazy',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setImgSrc(src)
    setHasError(false)
  }, [src])

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

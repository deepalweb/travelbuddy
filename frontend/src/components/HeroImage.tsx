import React from 'react'

// Base64 blur placeholders (40px versions)
const BLUR_MOBILE = "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvKAAKABEREREREREREREREREA"
const BLUR_TABLET = "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvKAAKABEREREREREREREREREA"
const BLUR_DESKTOP = "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvKAAKABEREREREREREREREREA"

export const HeroImage: React.FC = () => {
  return (
    <picture>
      <source
        media="(max-width: 767px)"
        srcSet="/images/hero-mobile.webp"
        type="image/webp"
      />
      <source
        media="(min-width: 768px) and (max-width: 1023px)"
        srcSet="/images/hero-tablet.webp"
        type="image/webp"
      />
      <source
        media="(min-width: 1024px)"
        srcSet="/images/hero-desktop.webp"
        type="image/webp"
        fetchPriority="high"
      />
      <img
        src="/images/hero-desktop.webp"
        alt=""
        aria-label="Hero background: tropical coastline at sunset"
        loading="eager"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          backgroundImage: `url(${BLUR_DESKTOP})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
    </picture>
  )
}

// Preload link for head
export const HeroImagePreload = () => (
  <link
    rel="preload"
    as="image"
    href="/images/hero-desktop.webp"
    type="image/webp"
    media="(min-width: 1024px)"
  />
)
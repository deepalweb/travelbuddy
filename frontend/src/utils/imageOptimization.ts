// Image optimization utilities for hero section

export const HERO_IMAGES = {
  mobile: {
    src: '/images/hero-mobile.webp',
    width: 640,
    height: 960,
    media: '(max-width: 767px)',
    blur: 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvKAAKABEREREREREREREREREA'
  },
  tablet: {
    src: '/images/hero-tablet.webp', 
    width: 1536,
    height: 1024,
    media: '(min-width: 768px) and (max-width: 1023px)',
    blur: 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvKAAKABEREREREREREREREREA'
  },
  desktop: {
    src: '/images/hero-desktop.webp',
    width: 2880, 
    height: 1800,
    media: '(min-width: 1024px)',
    blur: 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvKAAKABEREREREREREREREREA'
  }
} as const

import React from 'react'
import { Helmet } from 'react-helmet-async'

export const HeroPreload: React.FC = () => (
  <Helmet>
    <link
      rel="preload"
      as="image"
      href="/images/hero-desktop.webp"
      type="image/webp"
      media="(min-width: 1024px)"
    />
  </Helmet>
)
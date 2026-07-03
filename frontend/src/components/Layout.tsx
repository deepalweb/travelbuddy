import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { MainHeader } from './MainHeader'
import { Footer } from './Footer'
import { Breadcrumbs } from './Breadcrumbs'

export const Layout: React.FC = () => {
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === '/home'

  return (
    <div className="min-h-screen">
      <MainHeader />
      {!isHome && <Breadcrumbs />}
      <main className="pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

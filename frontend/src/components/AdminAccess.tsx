import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export const AdminAccess: React.FC = () => {
  const { user } = useAuth()

  const handleAdminLogin = () => {
    // Store admin credentials in localStorage and reload
    localStorage.setItem('mock_admin', 'true')
    window.location.reload()
  }

  if (user?.isAdmin || localStorage.getItem('mock_admin')) {
    return (
      <a 
        href="/admin"
        className="flex w-full sm:w-auto items-center justify-center gap-3 rounded-lg bg-green-600/80 px-4 py-2 text-white backdrop-blur-sm ring-1 ring-white/20 transition-all duration-300 ease-in-out hover:bg-green-700 hover:shadow-xl text-sm"
      >
        🛡️ Admin Panel
      </a>
    )
  }

  return (
    <a 
      href="/admin"
      className="flex w-full sm:w-auto items-center justify-center gap-3 rounded-lg bg-red-600/80 px-4 py-2 text-white backdrop-blur-sm ring-1 ring-white/20 transition-all duration-300 ease-in-out hover:bg-red-700 hover:shadow-xl text-sm"
    >
      🛡️ Admin Panel
    </a>
  )
}
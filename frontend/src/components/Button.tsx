import React from 'react'
import { cn } from '../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'default'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-[linear-gradient(135deg,#155e75,#0f172a)] text-white hover:opacity-95 focus:ring-sky-500 shadow-[0_16px_36px_rgba(15,23,42,0.16)]',
    default: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500 shadow-[0_14px_32px_rgba(15,23,42,0.14)]',
    secondary: 'bg-[linear-gradient(135deg,#f97316,#fb7185)] text-white hover:opacity-95 focus:ring-orange-400 shadow-[0_16px_36px_rgba(249,115,22,0.2)]',
    outline: 'border border-slate-300 text-slate-800 hover:bg-slate-50 focus:ring-slate-400',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  }
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  return (
    <button
      className={cn(
        baseClasses, 
        variants[variant], 
        sizes[size], 
        (loading || disabled) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
      )}
      {children}
    </button>
  )
}

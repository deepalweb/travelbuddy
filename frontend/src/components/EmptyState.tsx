import React from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div className="text-center py-12">
      <div className="text-gray-500">
        {icon && <div className="mb-4">{icon}</div>}
        <h3 className="text-xl font-medium mb-2">{title}</h3>
        <p className="mb-6">{message}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
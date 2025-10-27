import React, { useState, useEffect } from 'react'
import { Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface DatabaseStatusProps {
  className?: string
}

export const DatabaseStatus: React.FC<DatabaseStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [dbInfo, setDbInfo] = useState<any>(null)

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/db-check`)
      
      if (response.ok) {
        const data = await response.json()
        setDbInfo(data)
        setStatus(data.database.status === 'connected' ? 'connected' : 'disconnected')
      } else {
        setStatus('disconnected')
      }
    } catch (error) {
      console.error('Database status check failed:', error)
      setStatus('disconnected')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Database Connected'
      case 'disconnected':
        return 'Database Disconnected'
      default:
        return 'Checking Database...'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'disconnected':
        return 'text-red-700 bg-red-50 border-red-200'
      default:
        return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    }
  }

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getStatusColor()} ${className}`}>
      <Database className="w-4 h-4" />
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
      
      {dbInfo && status === 'connected' && (
        <div className="text-xs text-gray-500">
          ({dbInfo.counts.users} users, {dbInfo.counts.posts} posts)
        </div>
      )}
      
      <button
        onClick={checkDatabaseStatus}
        className="text-xs underline hover:no-underline"
        title="Refresh status"
      >
        Refresh
      </button>
    </div>
  )
}
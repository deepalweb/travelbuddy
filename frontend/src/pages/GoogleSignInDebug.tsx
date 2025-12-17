import React, { useEffect, useState } from 'react'
import { getRedirectResult } from 'firebase/auth'
import { auth } from '../lib/firebase'

export const GoogleSignInDebug: React.FC = () => {
  const [status, setStatus] = useState('Checking...')

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        console.log('🔍 Checking for redirect result...')
        const result = await getRedirectResult(auth)
        
        if (result) {
          console.log('✅ Redirect result found:', result)
          setStatus(`Success! User: ${result.user.email}`)
        } else {
          console.log('ℹ️ No redirect result')
          setStatus('No redirect result (normal page load)')
        }
      } catch (error: any) {
        console.error('❌ Redirect error:', error)
        setStatus(`Error: ${error.message}`)
      }
    }

    checkRedirect()
  }, [])

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 10, 
      right: 10, 
      background: '#000', 
      color: '#0f0', 
      padding: '10px', 
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      Google Redirect: {status}
    </div>
  )
}

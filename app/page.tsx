'use client'

import { useState, useEffect } from 'react'
import { useLeagueStore } from '@/lib/store'
import { AuthPage } from '@/components/auth-page'
import { PlayerDashboard } from '@/components/player-dashboard'
import { PlayerDirectory } from '@/components/player-directory'
import { AdminPanel } from '@/components/admin-panel'

type View = 'auth' | 'dashboard' | 'directory' | 'admin'

export default function Home() {
  const { currentUser, isAdminAuthenticated, adminLogout } = useLeagueStore()
  const [currentView, setCurrentView] = useState<View>('auth')
  const [mounted, setMounted] = useState(false)
  
  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Redirect based on login state
  useEffect(() => {
    if (mounted) {
      if (isAdminAuthenticated) {
        setCurrentView('admin')
      } else if (currentUser) {
        setCurrentView('dashboard')
      } else {
        setCurrentView('auth')
      }
    }
  }, [currentUser, isAdminAuthenticated, mounted])
  
  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Ronin League...</p>
        </div>
      </div>
    )
  }
  
  // Auth view
  if (currentView === 'auth') {
    return (
      <AuthPage 
        onSuccess={() => setCurrentView('dashboard')} 
        onAdminLogin={() => setCurrentView('admin')}
      />
    )
  }
  
  // Player Directory view
  if (currentView === 'directory') {
    return <PlayerDirectory onBack={() => setCurrentView('dashboard')} />
  }
  
  // Admin Panel view
  if (currentView === 'admin') {
    return (
      <AdminPanel 
        onBack={() => {
          adminLogout()
          setCurrentView('auth')
        }} 
      />
    )
  }
  
  // Dashboard view (default when logged in)
  return (
    <PlayerDashboard 
      onLogout={() => setCurrentView('auth')}
      onViewDirectory={() => setCurrentView('directory')}
    />
  )
}

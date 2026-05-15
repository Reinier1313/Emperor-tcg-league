'use client'

import { useState, useEffect } from 'react'
import { useLeagueStore } from '@/lib/store'
import { getCurrentSession } from '@/lib/supabaseIntegration'
import { AuthPage } from '@/components/auth-page'
import { ForgotPasswordPage } from '@/components/forgot-password-page'
import { PlayerDashboard } from '@/components/player-dashboard'
import { PlayerDirectory } from '@/components/player-directory'
import { AdminPanel } from '@/components/admin-panel'

type View = 'auth' | 'forgot-password' | 'dashboard' | 'directory' | 'admin'

export default function Home() {
  // CLEANED: Removed unused 'isAdminAuthenticated' and 'logout' to fix TypeScript errors
  const { currentUser, adminLogout } = useLeagueStore()
  const [currentView, setCurrentView] = useState<View>('auth')
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    const validateSession = async () => {
      const { session } = await getCurrentSession()
      
      // We call logout directly from the store state to avoid dependency warnings
      if (!session && useLeagueStore.getState().currentUser) {
        useLeagueStore.getState().logout()
      }
      
      setMounted(true)
    }
    
    validateSession()
  }, [])
  
  // Unlocked Routing Logic
  useEffect(() => {
    if (mounted) {
      // If user logs out, kick them to auth
      if (!currentUser && currentView !== 'forgot-password') {
        setCurrentView('auth')
      } 
      // If user just logged in (is on auth page), decide where to send them initially
      else if (currentUser && currentView === 'auth') {
        if (['admin', 'super_admin', 'moderator'].includes(currentUser.role)) {
          setCurrentView('admin')
        } else {
          setCurrentView('dashboard')
        }
      }
    }
  }, [currentUser, mounted, currentView])
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Emperor TCG League...</p>
        </div>
      </div>
    )
  }
  
  if (currentView === 'auth') {
    return (
      <AuthPage 
        onSuccess={() => setCurrentView('dashboard')} 
        onAdminLogin={() => setCurrentView('admin')}
        onForgotPassword={() => setCurrentView('forgot-password')}
      />
    )
  }

  if (currentView === 'forgot-password') {
    return <ForgotPasswordPage onBack={() => setCurrentView('auth')} />
  }
  
  if (currentView === 'directory') {
    return <PlayerDirectory onBack={() => setCurrentView('dashboard')} />
  }
  
  if (currentView === 'admin') {
    return (
      <AdminPanel 
        onBack={() => {
          adminLogout()
          setCurrentView('auth')
        }}
        onSwitchToDashboard={() => setCurrentView('dashboard')}
      />
    )
  }
  
  return (
    <PlayerDashboard 
      onLogout={() => setCurrentView('auth')}
      onViewDirectory={() => setCurrentView('directory')}
      onSwitchToAdmin={() => setCurrentView('admin')}
    />
  )
}
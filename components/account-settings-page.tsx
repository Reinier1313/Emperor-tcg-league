'use client'

import { useState } from 'react'
import { useLeagueStore } from '@/lib/store'
import { updatePlayerProfileInSupabase, updatePassword } from '@/lib/supabaseIntegration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PokeballIcon } from './pokeball-icon'
import {
  ArrowLeft, User, Lock, CheckCircle2, AlertCircle,
  Loader2, Eye, EyeOff, Shield, Mail
} from 'lucide-react'
import Image from 'next/image'

interface AccountSettingsPageProps {
  onBack: () => void
}

export function AccountSettingsPage({ onBack }: AccountSettingsPageProps) {
  const { currentUser, updatePlayerProfile } = useLeagueStore()

  // Username / Trainer Name
  const [username, setUsername] = useState(currentUser?.trainerName || '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  if (!currentUser) return null

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')

    if (!username.trim()) {
      setProfileError('Trainer name cannot be empty')
      return
    }

    if (username.trim() === currentUser.trainerName) {
      setProfileError('No changes detected')
      return
    }

    setProfileLoading(true)

    const result = await updatePlayerProfileInSupabase(currentUser.id, {
      username: username.trim(),
      full_name: currentUser.firstName + ' ' + currentUser.lastName,
    })

    if (result.success) {
      // Update local store too
      updatePlayerProfile(currentUser.id, { trainerName: username.trim() })
      setProfileSuccess('Trainer name updated successfully!')
      setTimeout(() => setProfileSuccess(''), 3000)
    } else {
      setProfileError(result.error || 'Failed to update profile')
    }

    setProfileLoading(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordLoading(true)

    const result = await updatePassword(newPassword)

    if (result.success) {
      setPasswordSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(''), 3000)
    } else {
      setPasswordError(result.error || 'Failed to update password')
    }

    setPasswordLoading(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-[5%]"><PokeballIcon size={30} /></div>
          <div className="absolute top-4 right-[10%]"><PokeballIcon size={25} /></div>
          <div className="absolute bottom-2 left-[20%]"><PokeballIcon size={20} /></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex flex-col items-center flex-1 text-center">
              <PokeballIcon size={36} className="mb-2" />
              <div className="relative w-full max-w-[220px] md:max-w-[300px] aspect-[4/1]">
                <Image
                  src="/emperor-tcg.png"
                  alt="Emperor TCG League"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h2 className="text-primary-foreground/80 mt-1 text-sm">Account Settings</h2>
            </div>
            <div className="w-10" /> {/* spacer to center the title */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-xl space-y-6">

        {/* Read-only account info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Account Info
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </span>
              <span className="font-medium text-card-foreground text-sm">{currentUser.email || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role
              </span>
              <span className="font-medium text-card-foreground text-sm capitalize">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground text-sm">Trainer ID</span>
              <span className="font-mono text-card-foreground text-sm">{currentUser.id}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Email cannot be changed. Contact an admin if needed.
            </p>
          </CardContent>
        </Card>

        {/* Change Trainer Name */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Change Trainer Name
            </CardTitle>
            <CardDescription>This is your public display name in the league</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              )}
              {profileSuccess && (
                <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription>{profileSuccess}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="trainer-name">Trainer Name</Label>
                <Input
                  id="trainer-name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter new trainer name"
                  disabled={profileLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={profileLoading}>
                {profileLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Trainer Name'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </CardTitle>
            <CardDescription>Make sure it's at least 6 characters</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              {passwordSuccess && (
                <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription>{passwordSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pr-10"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={passwordLoading}>
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
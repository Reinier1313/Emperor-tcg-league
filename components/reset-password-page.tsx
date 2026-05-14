'use client'

import { useState, useEffect } from 'react'
import { updatePassword } from '@/lib/supabaseIntegration'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PokeballIcon } from './pokeball-icon'
import { AlertCircle, CheckCircle2, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

interface ResetPasswordPageProps {
  token?: string
}

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const [step, setStep] = useState<'loading' | 'password' | 'success' | 'error'>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokenError, setTokenError] = useState('')

  // Listen for Supabase to exchange the hash fragment token (PASSWORD_RECOVERY event)
  useEffect(() => {
    if (!supabase) {
      setTokenError('Supabase not configured. Please try again later.')
      setStep('error')
      return
    }

    // Supabase fires PASSWORD_RECOVERY once it has successfully exchanged the
    // access_token from the URL hash fragment. We must listen for this event
    // rather than calling getSession() immediately, because the exchange is async.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Token exchanged — allow the user to set a new password
          setStep('password')
        } else if (event === 'SIGNED_IN' && session) {
          // Some Supabase versions emit SIGNED_IN instead of PASSWORD_RECOVERY
          setStep('password')
        }
      }
    )

    // Fallback: give Supabase up to 3s to fire the event, then check session directly
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setTokenError('Invalid or expired reset link. Please request a new password reset.')
        setStep('error')
      }
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  // Validate password strength
  const validatePassword = (pwd: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (pwd.length < 8) {
      errors.push('Password must be at least 8 characters')
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Password must contain uppercase letter')
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('Password must contain lowercase letter')
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('Password must contain number')
    }
    if (!/[!@#$%^&*]/.test(pwd)) {
      errors.push('Password must contain special character (!@#$%^&*)')
    }

    return { valid: errors.length === 0, errors }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate inputs
    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const { valid, errors: validationErrors } = validatePassword(password)
    if (!valid) {
      setError(validationErrors.join('. '))
      return
    }

    setLoading(true)

    try {
      const result = await updatePassword(password)

      if (result.success) {
        setStep('success')
      } else {
        setError(result.error || 'Failed to reset password. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying reset link…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Invalid Reset Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{tokenError}</p>
            <Button asChild className="w-full">
              <a href="/">Return to Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              Password Reset Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your password has been reset successfully. You can now login with your new password.
            </p>
            <Button asChild className="w-full">
              <a href="/">Return to Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <PokeballIcon className="w-12 h-12" />
          </div>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1 p-3 bg-blue-50 rounded">
              <p className="font-semibold">Password Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>At least 8 characters</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One lowercase letter (a-z)</li>
                <li>One number (0-9)</li>
                <li>One special character (!@#$%^&*)</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
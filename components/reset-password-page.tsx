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
  const [step, setStep] = useState<'password' | 'success' | 'error'>('password')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokenError, setTokenError] = useState('')

  // Check if we have a valid Supabase session (Supabase automatically handles the token)
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        setTokenError('Supabase not configured. Please try again later.')
        setStep('error')
        return
      }

      // Supabase auth recovery token is automatically handled via the URL fragment
      // If the user accessed this page via the reset email link, Supabase will have
      // automatically loaded the session into auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setTokenError('Invalid or expired reset link. Please request a new password reset.')
        setStep('error')
      }
    }

    checkSession()
  }, [])

  const validatePassword = (): boolean => {
    if (!password) {
      setError('Please enter a new password')
      return false
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    if (!confirmPassword) {
      setError('Please confirm your password')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validatePassword()) {
      return
    }

    setLoading(true)

    const result = await updatePassword(password)

    if (result.success) {
      setStep('success')
      setPassword('')
      setConfirmPassword('')
    } else {
      setError(result.error || 'Failed to reset password. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-[10%]"><PokeballIcon size={40} /></div>
          <div className="absolute top-8 right-[15%]"><PokeballIcon size={30} /></div>
          <div className="absolute bottom-4 left-[30%]"><PokeballIcon size={35} /></div>
          <div className="absolute bottom-6 right-[25%]"><PokeballIcon size={25} /></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col items-center text-center">
            <PokeballIcon size={48} className="mb-4" />
            <div className="relative w-full max-w-[300px] md:max-w-[400px] aspect-[4/1]">
              <Image
                src="/emperor-tcg.png"
                alt="Emperor TCG League"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-primary-foreground/80 mt-2">Official Trainer Registry</h2>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex items-start justify-center">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock className="w-5 h-5" />
              <CardTitle className="text-xl">Create New Password</CardTitle>
            </div>
            <CardDescription>
              {step === 'password'
                ? 'Enter your new password'
                : step === 'success'
                ? 'Password reset successful'
                : 'Password reset failed'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'password' ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
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
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
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
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            ) : step === 'success' ? (
              <div className="space-y-4">
                <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription>
                    Your password has been reset successfully!
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    You can now log in with your new password.
                  </p>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => (window.location.href = '/')}
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {tokenError || 'An error occurred. Please request a new password reset.'}
                  </AlertDescription>
                </Alert>

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => (window.location.href = '/')}
                >
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

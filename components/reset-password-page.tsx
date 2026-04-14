'use client'

import { useState, useEffect } from 'react'
import { resetPasswordWithToken } from '@/lib/supabaseIntegration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PokeballIcon } from './pokeball-icon'
import { AlertCircle, CheckCircle2, Lock, Loader2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface ResetPasswordPageProps {
  token?: string
}

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const [step, setStep] = useState<'password' | 'success' | 'error'>('password')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if token is present in URL
    if (!token && typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      const params = new URLSearchParams(hash)
      const tokenFromUrl = params.get('access_token')
      
      if (!tokenFromUrl) {
        setStep('error')
        setError('Invalid or missing reset token. Please request a new password reset link.')
      }
    }
  }, [token])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters')
      setLoading(false)
      return
    }

    if (!token && typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      const params = new URLSearchParams(hash)
      const tokenFromUrl = params.get('access_token')
      
      if (!tokenFromUrl) {
        setError('Invalid reset token. Please request a new password reset link.')
        setLoading(false)
        return
      }

      const result = await resetPasswordWithToken(tokenFromUrl, newPassword)

      if (result.success) {
        setStep('success')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(result.error || 'Failed to reset password. Please try again.')
      }
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
              <CardTitle className="text-xl">Set New Password</CardTitle>
            </div>
            <CardDescription>
              {step === 'password'
                ? 'Enter your new password'
                : step === 'success'
                ? 'Password reset successfully!'
                : 'Unable to reset password'}
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
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Set New Password'
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
                  <p>You can now login with your new password.</p>
                </div>

                <Link href="/" className="block">
                  <Button className="w-full gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>

                <Link href="/" className="block">
                  <Button className="w-full gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

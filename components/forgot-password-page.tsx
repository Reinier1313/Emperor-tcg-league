'use client'

import { useState } from 'react'
import { requestPasswordReset } from '@/lib/supabaseIntegration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PokeballIcon } from './pokeball-icon'
import { AlertCircle, CheckCircle2, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'

interface ForgotPasswordPageProps {
  onBack: () => void
}

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<'email' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    const result = await requestPasswordReset(email)

    if (result.success) {
      setStep('success')
      setEmail('')
    } else {
      setError(result.error || 'Failed to send reset email. Please try again.')
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
              <CardTitle className="text-xl">Reset Password</CardTitle>
            </div>
            <CardDescription>
              {step === 'email'
                ? 'Enter your email to receive a password reset link'
                : 'Check your email for reset instructions'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll send you a link to reset your password
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full gap-2"
                  onClick={onBack}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription>
                    Password reset email sent successfully!
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Check your email inbox for a message from Emperor TCG League with instructions to reset your password.
                  </p>
                  <p>
                    If you don&apos;t see the email:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure the email address is correct</li>
                    <li>Wait a few moments and refresh your inbox</li>
                  </ul>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    setStep('email')
                    setError('')
                  }}
                >
                  <Mail className="w-4 h-4" />
                  Try Another Email
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full gap-2"
                  onClick={onBack}
                >
                  <ArrowLeft className="w-4 h-4" />
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

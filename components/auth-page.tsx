'use client'

import { useState } from 'react'
import { useLeagueStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PokeballIcon } from './pokeball-icon'
import { CheckCircle2, AlertCircle, User, Lock, IdCard, UserPlus, Shield } from 'lucide-react'

interface AuthPageProps {
  onSuccess: () => void
  onAdminLogin: () => void
}

export function AuthPage({ onSuccess, onAdminLogin }: AuthPageProps) {
  const { register, login } = useLeagueStore()
  
  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  // Register state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [trainerName, setTrainerName] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState<{ trainerId: string } | null>(null)
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    
    if (!loginIdentifier || !loginPassword) {
      setLoginError('Please fill in all fields')
      return
    }
    
    const result = login(loginIdentifier, loginPassword)
    if (result.success) {
      if (result.isAdmin) {
        onAdminLogin()
      } else {
        onSuccess()
      }
    } else {
      setLoginError(result.message)
    }
  }
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError('')
    setRegisterSuccess(null)
    
    if (!firstName || !lastName || !trainerName || !registerPassword) {
      setRegisterError('Please fill in all fields')
      return
    }
    
    if (registerPassword !== confirmPassword) {
      setRegisterError('Passwords do not match')
      return
    }
    
    if (registerPassword.length < 4) {
      setRegisterError('Password must be at least 4 characters')
      return
    }
    
    const result = register({
      firstName,
      lastName,
      trainerName,
      password: registerPassword,
    })
    
    if (result.success && result.player) {
      setRegisterSuccess({ trainerId: result.player.id })
      // Clear form
      setFirstName('')
      setLastName('')
      setTrainerName('')
      setRegisterPassword('')
      setConfirmPassword('')
    } else {
      setRegisterError(result.message)
    }
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
            <h1 className="text-3xl md:text-4xl font-black tracking-wider">Tondo Battle LEAGUE</h1>
            <p className="text-primary-foreground/80 mt-2">Official Trainer Registry</p>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex items-start justify-center">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Trainer Access</CardTitle>
            <CardDescription>Login or register to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login" className="gap-2">
                  <User className="w-4 h-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Register
                </TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-identifier" className="flex items-center gap-2">
                      <IdCard className="w-4 h-4" />
                      Trainer Name or ID
                    </Label>
                    <Input
                      id="login-identifier"
                      placeholder="Enter trainer name or RL-XXXXX"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Enter League
                  </Button>
                </form>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  {registerError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{registerError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {registerSuccess && (
                    <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <AlertDescription>
                        Registration successful! Your Trainer ID is{' '}
                        <span className="font-mono font-bold">{registerSuccess.trainerId}</span>
                        . You can now login.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trainerName">Trainer Name</Label>
                    <Input
                      id="trainerName"
                      placeholder="Choose a unique trainer name"
                      value={trainerName}
                      onChange={(e) => setTrainerName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">This will be your public display name</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">Password</Label>
                    <Input
                      id="registerPassword"
                      type="password"
                      placeholder="Create a password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Register Trainer
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

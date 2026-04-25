'use client'

import { useSearchParams } from 'next/navigation'
import { ResetPasswordPage } from '@/components/reset-password-page'

export function ResetPasswordPageClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  return <ResetPasswordPage token={token || undefined} />
}

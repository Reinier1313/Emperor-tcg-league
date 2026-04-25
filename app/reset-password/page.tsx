'use client'

import { useSearchParams } from 'next/navigation'
import { ResetPasswordPage } from '@/components/reset-password-page'

export default function ResetPasswordRoute() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  return <ResetPasswordPage token={token || undefined} />
}

"use client"

import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/login-form"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        router.push("/admin")
      } else if (user.role === "teacher") {
        router.push("/teacher")
      } else {
        router.push("/student")
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-slate-50">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-slate-50 p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-5xl font-bold text-balance mb-4 bg-gradient-to-r from-cyan-600 to-slate-700 bg-clip-text text-transparent">
            {/* Ifeoluwa Group Of Schools */}
            CBT TEST
          </h1>
          <p className="text-xl text-muted-foreground text-pretty mb-6">
            A professional testing platform designed for modern education
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Secure authentication system</p>
            <p>✓ Real-time test monitoring</p>
            <p>✓ Comprehensive analytics</p>
            <p>✓ Teacher question management</p>
          </div>
        </div>

        <div className="flex-1 w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Clock, FileText, Award } from "lucide-react"

export default function StudentDashboard() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [tests, setTests] = useState<any[]>([])

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchTests()
    }
  }, [user])

  async function fetchTests() {
    try {
      const response = await fetch("/api/tests")
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests)
      }
    } catch (error) {
      console.error("[v0] Error fetching tests:", error)
    }
  }

  async function handleLogout() {
    await logout()
    router.push("/")
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-slate-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">CBT Platform</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Available Tests</h2>
          <p className="text-muted-foreground">Select a test to begin your assessment</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Card key={test.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {test.title}
                </CardTitle>
                <CardDescription>{test.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {test.duration_minutes} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    Pass: {test.passing_score}%
                  </div>
                </div>
                <Button className="w-full" onClick={() => router.push(`/student/test/${test.id}`)}>
                  Start Test
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {tests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tests available at the moment</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

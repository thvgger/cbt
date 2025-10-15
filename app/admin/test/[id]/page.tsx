"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  order_index: number
}

interface Test {
  id: number
  title: string
  description: string
  duration_minutes: number
  passing_score: number
  calculator_allowed: boolean
  teacher_name: string
  created_at: string
}

export default function AdminTestView() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchTestData()
    }
  }, [user, testId])

  async function fetchTestData() {
    try {
      const [testRes, questionsRes] = await Promise.all([
        fetch(`/api/admin/tests/${testId}`),
        fetch(`/api/tests/${testId}/questions`),
      ])

      if (testRes.ok) {
        const data = await testRes.json()
        setTest(data.test)
      }

      if (questionsRes.ok) {
        const data = await questionsRes.json()
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error("[v0] Error fetching test data:", error)
    }
  }

  if (loading || !user || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-slate-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{test.title}</CardTitle>
            <p className="text-muted-foreground">{test.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Teacher</p>
                <p className="font-medium">{test.teacher_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{test.duration_minutes} minutes</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Passing Score</p>
                <p className="font-medium">{test.passing_score}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Calculator</p>
                <Badge variant={test.calculator_allowed ? "default" : "secondary"}>
                  {test.calculator_allowed ? "Allowed" : "Not Allowed"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border-b pb-6 last:border-b-0">
                <h3 className="font-semibold mb-3">
                  {index + 1}. {question.question_text}
                </h3>
                <div className="space-y-2 ml-4">
                  {["A", "B", "C", "D"].map((option) => {
                    const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string
                    const isCorrect = question.correct_answer === option

                    return (
                      <div
                        key={option}
                        className={`p-3 rounded-lg ${isCorrect ? "bg-green-50 border border-green-200" : "bg-muted"}`}
                      >
                        <span className="font-medium">{option}.</span> {optionText}
                        {isCorrect && (
                          <Badge variant="default" className="ml-2">
                            Correct Answer
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

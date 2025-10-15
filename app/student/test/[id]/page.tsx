"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle2, AlertCircle, CalculatorIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calculator } from "@/components/calculator"

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  order_index: number
}

interface Test {
  id: number
  title: string
  description: string
  duration_minutes: number
  passing_score: number
  calculator_allowed: boolean
}

const QUESTIONS_PER_PAGE = 5

export default function TestPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [testStarted, setTestStarted] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchTestData()
    }
  }, [user, testId])

  useEffect(() => {
    if (testStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitTest()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [testStarted, timeRemaining])

  async function fetchTestData() {
    try {
      const [testRes, questionsRes] = await Promise.all([
        fetch(`/api/tests/${testId}`),
        fetch(`/api/tests/${testId}/questions`),
      ])

      if (testRes.ok && questionsRes.ok) {
        const testData = await testRes.json()
        const questionsData = await questionsRes.json()
        setTest(testData.test)
        setQuestions(questionsData.questions)
        setTimeRemaining(testData.test.duration_minutes * 60)
      }
    } catch (error) {
      console.error("[v0] Error fetching test data:", error)
    }
  }

  function handleStartTest() {
    setTestStarted(true)
  }

  function handleAnswerSelect(questionId: number, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  function toggleFlag(questionId: number) {
    setFlagged((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  async function handleSubmitTest() {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/tests/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })

      if (response.ok) {
        router.push("/student")
      }
    } catch (error) {
      console.error("[v0] Error submitting test:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">{test.title}</h1>
              <p className="text-muted-foreground">{test.description}</p>
            </div>

            <div className="space-y-4 mb-8">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Duration:</strong> {test.duration_minutes} minutes
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Total Questions:</strong> {questions.length}
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Passing Score:</strong> {test.passing_score}%
                </AlertDescription>
              </Alert>

              {test.calculator_allowed && (
                <Alert>
                  <CalculatorIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Calculator:</strong> Available during test
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="bg-muted p-4 rounded-lg mb-8">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Read each question carefully before answering</li>
                <li>• You can navigate between pages using the navigation buttons</li>
                <li>• Flag questions you want to review later</li>
                {test.calculator_allowed && <li>• Use the calculator button in the header if needed</li>}
                <li>• The test will auto-submit when time runs out</li>
                <li>• Make sure to review all answers before submitting</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.push("/student")} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleStartTest} className="flex-1">
                Start Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE)
  const startIndex = currentPage * QUESTIONS_PER_PAGE
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, questions.length)
  const currentQuestions = questions.slice(startIndex, endIndex)
  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / questions.length) * 100

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{test.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {startIndex + 1}-{endIndex} of {questions.length}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {test.calculator_allowed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className={cn(showCalculator && "bg-primary text-primary-foreground")}
                >
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  Calculator
                </Button>
              )}

              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <Clock className="h-4 w-4" />
                <span className={cn("font-mono font-semibold", timeRemaining < 300 && "text-destructive")}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>
                Progress: {answeredCount}/{questions.length} answered
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showCalculator && (
          <div className="fixed top-20 right-4 z-20">
            <Calculator onClose={() => setShowCalculator(false)} />
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-6">
          {currentQuestions.map((question, index) => {
            const questionNumber = startIndex + index + 1
            const selectedAnswer = answers[question.id]
            const isFlagged = flagged.has(question.id)

            return (
              <Card key={question.id} className={cn(isFlagged && "border-amber-500")}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold flex-1">
                      {questionNumber}. {question.question_text}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFlag(question.id)}
                      className={cn(isFlagged && "text-amber-500")}
                    >
                      <Flag className={cn("h-4 w-4", isFlagged && "fill-current")} />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {["A", "B", "C", "D"].map((option) => {
                      const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string
                      const isSelected = selectedAnswer === option

                      return (
                        <button
                          key={option}
                          onClick={() => handleAnswerSelect(question.id, option)}
                          className={cn(
                            "w-full text-left p-4 rounded-lg border-2 transition-all",
                            "hover:border-primary/50 hover:bg-primary/5",
                            isSelected ? "border-primary bg-primary/10 font-medium" : "border-border bg-background",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground",
                              )}
                            >
                              {isSelected && <CheckCircle2 className="h-4 w-4" />}
                            </div>
                            <span>
                              <strong>{option}.</strong> {optionText}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Navigation */}
        <div className="max-w-4xl mx-auto mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={cn(
                  "w-10 h-10 rounded-lg border-2 font-medium transition-all",
                  currentPage === i
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/50",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentPage < totalPages - 1 ? (
            <Button onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setShowSubmitDialog(true)} variant="default">
              Submit Test
            </Button>
          )}
        </div>
      </main>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Warning: {questions.length - answeredCount} questions are unanswered.
                </span>
              )}
              <span className="block mt-2">Are you sure you want to submit your test?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitTest} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Test"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

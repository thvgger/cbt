"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react"
// Local Answer shape used by the frontend test components (not the DB shape)
type Answer = {
  questionId: number
  selectedOption: string
  isCorrect: boolean
}
import { testQuestions } from "@/lib/test-data"

interface TestInterfaceProps {
  onSubmitTest: (answers: Answer[]) => void
  timeRemaining: number
  setTimeRemaining: (time: number) => void
}

export function TestInterface({ onSubmitTest, timeRemaining, setTimeRemaining }: TestInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining(timeRemaining - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, setTimeRemaining])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: value,
    }))
  }

  const handleFlagQuestion = () => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion)
      } else {
        newSet.add(currentQuestion)
      }
      return newSet
    })
  }

  const handleSubmit = () => {
    const finalAnswers: Answer[] = testQuestions.map((question, index) => ({
      questionId: index,
      selectedOption: answers[index] || "",
      isCorrect: answers[index] === question.correctAnswer,
    }))
    onSubmitTest(finalAnswers)
  }

  const progress = ((currentQuestion + 1) / testQuestions.length) * 100
  const answeredCount = Object.keys(answers).length
  const isTimeRunningOut = timeRemaining <= 300 // 5 minutes

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">Computer Science Assessment</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {testQuestions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isTimeRunningOut ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                  }`}
              >
                <Clock className="h-4 w-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
              <Button onClick={handleSubmit} variant="default">
                Submit Test
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{answeredCount} answered</span>
              <span>{testQuestions.length - answeredCount} remaining</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
                  {testQuestions.map((_, index) => (
                    <Button
                      key={index}
                      variant={currentQuestion === index ? "default" : "outline"}
                      size="sm"
                      className={`relative h-10 w-10 p-0 ${answers[index] ? "ring-2 ring-primary/20" : ""}`}
                      onClick={() => setCurrentQuestion(index)}
                    >
                      {index + 1}
                      {flaggedQuestions.has(index) && (
                        <Flag className="absolute -top-1 -right-1 h-3 w-3 text-destructive fill-destructive" />
                      )}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-primary rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="h-3 w-3 text-destructive fill-destructive" />
                    <span>Flagged</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Question {currentQuestion + 1}</Badge>
                    <Badge variant="secondary">{testQuestions[currentQuestion].category}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFlagQuestion}
                    className={flaggedQuestions.has(currentQuestion) ? "text-destructive" : ""}
                  >
                    <Flag className={`h-4 w-4 ${flaggedQuestions.has(currentQuestion) ? "fill-current" : ""}`} />
                    {flaggedQuestions.has(currentQuestion) ? "Unflag" : "Flag"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-foreground mb-4 text-pretty">
                    {testQuestions[currentQuestion].question}
                  </h2>

                  <RadioGroup
                    value={answers[currentQuestion] || ""}
                    onValueChange={handleAnswerChange}
                    className="space-y-3"
                  >
                    {testQuestions[currentQuestion].options.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm leading-relaxed">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    {answers[currentQuestion] ? "Answer selected" : "No answer selected"}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion(Math.min(testQuestions.length - 1, currentQuestion + 1))}
                    disabled={currentQuestion === testQuestions.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

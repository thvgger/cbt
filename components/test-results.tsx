"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, RotateCcw, Download, Trophy, Target } from "lucide-react"
// Local Answer shape used by the frontend test components (not the DB shape)
type Answer = {
  questionId: number
  selectedOption: string
  isCorrect: boolean
}
import { testQuestions } from "@/lib/test-data"

interface TestResultsProps {
  answers: Answer[]
  onRetakeTest: () => void
}

export function TestResults({ answers, onRetakeTest }: TestResultsProps) {
  const correctAnswers = answers.filter((answer) => answer.isCorrect).length
  const totalQuestions = answers.length
  const percentage = Math.round((correctAnswers / totalQuestions) * 100)
  const passed = percentage >= 70

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: "A", color: "text-green-600" }
    if (percentage >= 80) return { grade: "B", color: "text-blue-600" }
    if (percentage >= 70) return { grade: "C", color: "text-yellow-600" }
    if (percentage >= 60) return { grade: "D", color: "text-orange-600" }
    return { grade: "F", color: "text-red-600" }
  }

  const { grade, color } = getGrade(percentage)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          {passed ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Target className="h-8 w-8 text-red-600" />
            </div>
          )}
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">{passed ? "Congratulations!" : "Test Complete"}</h1>
        <p className="text-xl text-muted-foreground">
          {passed ? "You have successfully passed the assessment" : "Keep studying and try again"}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-foreground">{percentage}%</CardTitle>
            <CardDescription>Overall Score</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={passed ? "default" : "destructive"} className="text-lg px-3 py-1">
              {passed ? "PASSED" : "FAILED"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className={`text-3xl font-bold ${color}`}>{grade}</CardTitle>
            <CardDescription>Letter Grade</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {correctAnswers} out of {totalQuestions} correct
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-foreground">70%</CardTitle>
            <CardDescription>Passing Score</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={percentage} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
          <CardDescription>Review your answers for each question</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {answers.map((answer, index) => {
              const question = testQuestions[index]
              return (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Q{index + 1}</Badge>
                      <Badge variant="secondary">{question.category}</Badge>
                    </div>
                    {answer.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>

                  <h3 className="font-medium text-foreground mb-3 text-pretty">{question.question}</h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Your answer:</span>
                      <Badge variant={answer.isCorrect ? "default" : "destructive"}>
                        {answer.selectedOption || "No answer"}
                      </Badge>
                    </div>
                    {!answer.isCorrect && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Correct answer:</span>
                        <Badge variant="outline" className="border-green-600 text-green-600">
                          {question.correctAnswer}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onRetakeTest} variant="outline" size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Retake Test
        </Button>
        <Button variant="default" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Download Certificate
        </Button>
      </div>
    </div>
  )
}

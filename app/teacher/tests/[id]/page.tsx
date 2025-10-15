"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Question {
  id?: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: "A" | "B" | "C" | "D"
}

export default function EditTestPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("30")
  const [passingScore, setPassingScore] = useState("70")
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [classesList, setClassesList] = useState<{ id: number; name: string }[]>([])
  const [selectedClass, setSelectedClass] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!loading && (!user || user.role !== "teacher")) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchTestData()
      fetchClasses()
    }
  }, [user, testId])

  async function fetchTestData() {
    try {
      const [testRes, questionsRes] = await Promise.all([
        fetch(`/api/tests/${testId}`),
        fetch(`/api/teacher/tests/${testId}/questions`),
      ])

      if (testRes.ok && questionsRes.ok) {
        const testData = await testRes.json()
        const questionsData = await questionsRes.json()

        setTitle(testData.test.title)
        setDescription(testData.test.description || "")
        setDuration(testData.test.duration_minutes.toString())
        setPassingScore(testData.test.passing_score.toString())
        setSelectedClass(testData.test.class_id ?? undefined)
        setQuestions(questionsData.questions)
      }
    } catch (error) {
      console.error("[v0] Error fetching test data:", error)
    }
  }

  async function fetchClasses() {
    try {
      const res = await fetch('/api/admin/classes')
      if (res.ok) {
        const data = await res.json()
        setClassesList(data.classes || [])
      }
    } catch (err) {
      // ignore
    }
  }

  function addQuestion() {
    setQuestions([
      ...questions,
      { question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "A" },
    ])
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  function updateQuestion(index: number, field: keyof Question, value: string) {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Test title is required")
      return
    }

    if (questions.length === 0) {
      setError("At least one question is required")
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (
        !q.question_text.trim() ||
        !q.option_a.trim() ||
        !q.option_b.trim() ||
        !q.option_c.trim() ||
        !q.option_d.trim()
      ) {
        setError(`Question ${i + 1} is incomplete`)
        return
      }
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/teacher/tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          duration_minutes: Number.parseInt(duration),
          passing_score: Number.parseInt(passingScore),
          questions,
          class_id: typeof selectedClass === 'number' ? selectedClass : undefined,
        }),
      })

      if (response.ok) {
        router.push("/teacher")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update test")
      }
    } catch (err) {
      setError("Failed to update test")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-slate-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push("/teacher")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Edit Test</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Test Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Test Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Mathematics Final Exam"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the test"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passing">Passing Score (%) *</Label>
                    <Input
                      id="passing"
                      type="number"
                      min="0"
                      max="100"
                      value={passingScore}
                      onChange={(e) => setPassingScore(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">Assign to Class</Label>
                  <select
                    id="class"
                    className="border rounded-md px-2 py-1 w-full"
                    value={selectedClass ?? ""}
                    onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">-- none --</option>
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Questions</h2>
              <Button type="button" onClick={addQuestion} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>

            {questions.map((question, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                    {questions.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question Text *</Label>
                    <Textarea
                      value={question.question_text}
                      onChange={(e) => updateQuestion(index, "question_text", e.target.value)}
                      placeholder="Enter your question"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Option A *</Label>
                      <Input
                        value={question.option_a}
                        onChange={(e) => updateQuestion(index, "option_a", e.target.value)}
                        placeholder="Option A"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Option B *</Label>
                      <Input
                        value={question.option_b}
                        onChange={(e) => updateQuestion(index, "option_b", e.target.value)}
                        placeholder="Option B"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Option C *</Label>
                      <Input
                        value={question.option_c}
                        onChange={(e) => updateQuestion(index, "option_c", e.target.value)}
                        placeholder="Option C"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Option D *</Label>
                      <Input
                        value={question.option_d}
                        onChange={(e) => updateQuestion(index, "option_d", e.target.value)}
                        placeholder="Option D"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Correct Answer *</Label>
                    <Select
                      value={question.correct_answer}
                      onValueChange={(value) => updateQuestion(index, "correct_answer", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.push("/teacher")} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

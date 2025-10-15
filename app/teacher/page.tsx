"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Plus, FileText, Users, BarChart3, Edit, Trash2 } from "lucide-react"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface Test {
  id: number
  title: string
  description: string
  duration_minutes: number
  passing_score: number
  is_active: boolean
  question_count: number
  attempt_count: number
}

export default function TeacherDashboard() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  const [tests, setTests] = useState<Test[]>([])
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [classesList, setClassesList] = useState<Array<{ id: number; name: string }>>([])
  const [classFilter, setClassFilter] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [filterPass, setFilterPass] = useState<string>("")
  const [loadingResults, setLoadingResults] = useState(true)
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchTests()
    }
  }, [user])

  useEffect(() => {
    fetchResults()
    fetchClasses()
  }, [])

  async function fetchClasses() {
    try {
      const res = await fetch('/api/admin/classes')
      if (res.ok) {
        const data = await res.json()
        setClassesList(data.classes || [])
      }
    } catch (err) {
      console.error('[v0] Error fetching classes:', err)
    }
  }

  async function fetchTests() {
    try {
      const res = await fetch("/api/teacher/tests")
      if (res.ok) {
        const data = await res.json()
        setTests(data.tests || [])
      }
    } catch (err) {
      console.error("[v0] Error fetching tests:", err)
    }
  }

  async function fetchResults() {
    setLoadingResults(true)
    try {
      const res = await fetch("/api/teacher/results")
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
      } else {
        setError("Failed to load results")
      }
    } catch (err) {
      console.error("[v0] Error fetching results:", err)
      setError("Failed to load results")
    } finally {
      setLoadingResults(false)
    }
  }

  const totalAttempts = results.length
  const avgScore = totalAttempts ? (results.reduce((sum, r) => sum + r.score, 0) / totalAttempts).toFixed(2) : "-"
  const passRate = totalAttempts ? ((results.filter(r => r.passed).length / totalAttempts) * 100).toFixed(1) : "-"

  const filteredResults = results.filter(r => {
    const matchesTest = selectedTestId === null || r.test_id === selectedTestId
    const matchesSearch = r.student_name.toLowerCase().includes(search.toLowerCase()) || r.test_title.toLowerCase().includes(search.toLowerCase())
    const matchesClass = classFilter === null || r.class_id === classFilter
    const matchesPass = filterPass === "" || (filterPass === "pass" && r.passed) || (filterPass === "fail" && !r.passed)
    return matchesTest && matchesSearch && matchesPass && matchesClass
  })

  const toggleSelect = (id: number) => {
    setSelected(sel => (sel.includes(id) ? sel.filter(sid => sid !== id) : [...sel, id]))
  }
  const selectAll = () => setSelected(filteredResults.map(r => r.attempt_id))
  const clearAll = () => setSelected([])
  const selectedResults = filteredResults.filter(r => selected.includes(r.attempt_id))

  function downloadCSV(data: any[], filename: string) {
    const csvRows = [
      ["Attempt ID", "Student Name", "Student Email", "Class", "Test Title", "Score", "Passed", "Completed At"],
      ...data.map(r => [r.attempt_id, r.student_name, r.student_email, r.class_name ?? '', r.test_title, r.score, r.passed ? "Yes" : "No", r.completed_at]),
    ]
    const csvContent = csvRows.map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const response = await fetch(`/api/teacher/tests/${deleteId}`, { method: "DELETE" })
      if (response.ok) {
        setTests(prev => prev.filter(t => t.id !== deleteId))
        setDeleteId(null)
      }
    } catch (err) {
      console.error("[v0] Error deleting test:", err)
    }
  }

  async function handleLogout() {
    await logout()
    router.push("/")
  }

  if (authLoading || !user) {
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
            <h1 className="text-2xl font-bold text-primary">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="exam" className="space-y-6">
          <TabsList>
            <TabsTrigger value="exam">Manage Tests</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="exam">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Manage Tests</h2>
                <p className="text-muted-foreground">Create and manage your assessments</p>
              </div>
              <Button onClick={() => router.push("/teacher/tests/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Test
              </Button>
            </div>

            <div className="grid gap-6">
              {tests.map(test => (
                <Card key={test.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          {test.title}
                          {!test.is_active && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Inactive</span>
                          )}
                        </CardTitle>
                        <CardDescription>{test.description}</CardDescription>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/tests/${test.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteId(test.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}

              {tests.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No tests created yet</p>
                    <Button onClick={() => router.push("/teacher/tests/new")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Test
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>







          <TabsContent value="results">
            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Check Results</h2>
                <p className="text-muted-foreground">View and manage student test results</p>
              </div>
              <Button onClick={() => router.push("/teacher/tests/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Test
              </Button>
            </div>

            <div className="grid gap-6">
              {tests.map(test => (
                <Card key={test.id} onClick={() => router.push(`/teacher/results/${test.id}`)} className="hover:cursor-pointer mb-3">
                  <CardHeader >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          {test.title}
                          {!test.is_active && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Inactive</span>
                          )}
                        </CardTitle>
                        {/* <CardDescription>{test.description}</CardDescription> */}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}

              {tests.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No tests created yet</p>
                    <Button onClick={() => router.push("/teacher/tests/new")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Test
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* <div className="mb-4 flex gap-4 items-center">
              <div className="flex-1">
                <input type="text" placeholder="Search by student name or test" value={search} onChange={e => setSearch(e.target.value)} className="border px-2 py-1 rounded w-full" />
              </div>
              <select value={filterPass} onChange={e => setFilterPass(e.target.value)} className="border px-2 py-1 rounded">
                <option value="">All</option>
                <option value="pass">Passed</option>
                <option value="fail">Failed</option>
              </select>
              <select value={classFilter ?? ''} onChange={e => setClassFilter(e.target.value === '' ? null : Number(e.target.value))} className="border px-2 py-1 rounded">
                <option value="">All classes</option>
                {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 mt-4">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 text-sm sticky top-0">
                  <tr>
                    <th className="p-3 w-10"></th>
                    <th className="p-3">Attempt ID</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Student Email</th>
                    <th className="p-3 text-center">Score</th>
                    <th className="p-3 text-center">Passed</th>
                    <th className="p-3">Completed At</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {loadingResults ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">No results found.</td>
                    </tr>
                  ) : (
                    filteredResults.map((r) => (
                      <tr key={r.attempt_id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-center">
                          <input type="checkbox" checked={selected.includes(r.attempt_id)} onChange={() => toggleSelect(r.attempt_id)} className="accent-blue-500" />
                        </td>
                        <td className="p-3 font-medium text-gray-700">{r.attempt_id}</td>
                        <td className="p-3">{r.student_name}</td>
                        <td className="p-3 text-gray-600">{r.student_email}</td>
                        <td className="p-3 text-center font-semibold text-gray-700">{r.score}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {r.passed ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500">{new Date(r.completed_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 mb-2 mt-4">
              <Button onClick={selectAll}>Select All</Button>
              <Button onClick={clearAll}>Clear Selection</Button>
              <Button onClick={() => downloadCSV(selectedResults.length ? selectedResults : filteredResults, "test-results.csv")}>Export Selected to CSV</Button>
            </div> */}
          </TabsContent>

          <TabsContent value="stats">
            {/* Test filter dropdown */}
            <div className="mb-6 flex items-center gap-4">
              <label htmlFor="stats-test-filter" className="font-medium">Filter by Test:</label>
              <select
                id="stats-test-filter"
                value={selectedTestId ?? ''}
                onChange={e => setSelectedTestId(e.target.value === '' ? null : Number(e.target.value))}
                className="border px-2 py-1 rounded min-w-[200px]"
              >
                <option value="">All Tests</option>
                {tests.map(test => (
                  <option key={test.id} value={test.id}>{test.title}</option>
                ))}
              </select>
            </div>

            {(() => {
              // Filter results by selected test
              const statsResults = selectedTestId === null ? results : results.filter(r => r.test_id === selectedTestId)

              // Summary cards
              const totalAttempts = statsResults.length
              const avgScore = totalAttempts ? (statsResults.reduce((sum, r) => sum + r.score, 0) / totalAttempts).toFixed(2) : "-"
              const passRate = totalAttempts ? ((statsResults.filter(r => r.passed).length / totalAttempts) * 100).toFixed(1) : "-"

              return <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Attempts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{totalAttempts}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{avgScore}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Pass Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{passRate}%</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top students table */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-2">Top Students</h2>
                  <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Email</th>
                          <th className="p-3 text-center">Attempts</th>
                          <th className="p-3 text-center">Avg Score</th>
                          <th className="p-3 text-center">Pass Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Aggregate by student
                          const byStudent: Record<string, { name: string, email: string, attempts: number, avg: number, pass: number }> = {}
                          statsResults.forEach(r => {
                            if (!byStudent[r.student_email]) {
                              byStudent[r.student_email] = { name: r.student_name, email: r.student_email, attempts: 0, avg: 0, pass: 0 }
                            }
                            byStudent[r.student_email].attempts++
                            byStudent[r.student_email].avg += r.score
                            if (r.passed) byStudent[r.student_email].pass++
                          })
                          const rows = Object.values(byStudent)
                            .map(s => ({ ...s, avg: s.attempts ? (s.avg / s.attempts).toFixed(2) : '-', passRate: s.attempts ? ((s.pass / s.attempts) * 100).toFixed(1) : '-' }))
                            .sort((a, b) => Number(b.avg) - Number(a.avg))
                            .slice(0, 10)
                          if (rows.length === 0) return <tr><td colSpan={5} className="p-4 text-center text-gray-500">No data</td></tr>
                          return rows.map(s => (
                            <tr key={s.email}>
                              <td className="p-3 font-medium">{s.name}</td>
                              <td className="p-3 text-gray-600">{s.email}</td>
                              <td className="p-3 text-center">{s.attempts}</td>
                              <td className="p-3 text-center">{s.avg}</td>
                              <td className="p-3 text-center">{s.passRate}%</td>
                            </tr>
                          ))
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Test averages bar chart */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-2">Test Averages</h2>
                  <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 p-4">
                    {(() => {
                      // Aggregate by test
                      const byTest: Record<string, { title: string, attempts: number, avg: number }> = {}
                      statsResults.forEach(r => {
                        if (!byTest[r.test_id]) {
                          byTest[r.test_id] = { title: r.test_title, attempts: 0, avg: 0 }
                        }
                        byTest[r.test_id].attempts++
                        byTest[r.test_id].avg += r.score
                      })
                      const rows = Object.values(byTest)
                        .map(t => ({ ...t, avg: t.attempts ? (t.avg / t.attempts).toFixed(2) : '-' }))
                        .sort((a, b) => Number(b.avg) - Number(a.avg))
                      if (rows.length === 0) return <div className="text-center text-gray-500">No data</div>
                      return (
                        <div className="space-y-2">
                          {rows.map(t => (
                            <div key={t.title} className="flex items-center gap-2">
                              <div className="w-48 truncate">{t.title}</div>
                              <div className="flex-1 bg-gray-200 rounded h-4">
                                <div className="bg-blue-500 h-4 rounded" style={{ width: `${Math.min(Number(t.avg), 100)}%` }}></div>
                              </div>
                              <div className="w-12 text-right font-mono">{t.avg}</div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Recent activity */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
                  <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="p-3">Student</th>
                          <th className="p-3">Test</th>
                          <th className="p-3 text-center">Score</th>
                          <th className="p-3 text-center">Passed</th>
                          <th className="p-3">Completed At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsResults.slice(0, 20).map(r => (
                          <tr key={r.attempt_id}>
                            <td className="p-3 font-medium">{r.student_name}</td>
                            <td className="p-3">{r.test_title}</td>
                            <td className="p-3 text-center">{r.score}</td>
                            <td className="p-3 text-center">{r.passed ? "Yes" : "No"}</td>
                            <td className="p-3 text-gray-500">{new Date(r.completed_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            })()}
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the test and all associated questions and results.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

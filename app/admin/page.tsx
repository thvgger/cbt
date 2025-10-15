"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, BarChart3, LogOut, Trash2, Eye } from "lucide-react"
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
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select"

interface User {
  id: number
  email: string
  name: string
  role: string
  class_name?: string | null
  class_id?: number | null
  created_at: string
}

interface Test {
  id: number
  title: string
  duration_minutes: number
  passing_score: number
  question_count: number
  attempt_count: number
  created_by: number
  teacher_name: string
  created_at: string
}

interface Attempt {
  id: number
  student_name: string
  test_title: string
  score: number
  passed: boolean
  completed_at: string
}

interface Stats {
  total_users: number
  total_students: number
  total_teachers: number
  total_tests: number
  total_attempts: number
  average_score: number
}

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [teacherStats, setTeacherStats] = useState<Array<any>>([])
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null)
  const [deleteTestId, setDeleteTestId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null)
  const [classesList, setClassesList] = useState<Array<{ id: number; name: string }>>([])

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchData()
      fetchClasses()
    }
  }, [user])

  async function fetchClasses() {
    try {
      const res = await fetch('/api/admin/classes')
      if (res.ok) {
        const data = await res.json()
        setClassesList(data.classes || [])
      }
    } catch (err) {
      console.error('[v0] Error fetching classes', err)
    }
  }

  function focusFirstError(errors: Record<string,string>) {
    // prefer name, then email, then password
    try {
      if (errors.name) {
        nameRef.current?.focus()
        return
      }
      if (errors.email) {
        emailRef.current?.focus()
        return
      }
      if (errors.password) {
        passwordRef.current?.focus()
        return
      }
    } catch (e) {
      // ignore when document is not available
    }
  }

  async function fetchData() {
    try {
      const [usersRes, testsRes, attemptsRes, statsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/tests"),
        fetch("/api/admin/attempts"),
        fetch("/api/admin/stats"),
      ])

      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users)
      }

      if (testsRes.ok) {
        const data = await testsRes.json()
        setTests(data.tests)
      }

      if (attemptsRes.ok) {
        const data = await attemptsRes.json()
        setAttempts(data.attempts)
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }
      // fetch per-teacher stats
      try {
        const tRes = await fetch('/api/admin/teachers/stats')
        if (tRes.ok) {
          const td = await tRes.json()
          setTeacherStats(td.teachers || [])
        }
      } catch (e) {
        console.error('[v0] Error fetching teacher stats', e)
      }
    } catch (error) {
      console.error("[v0] Error fetching admin data:", error)
    }
  }

  // derived filtered users will be computed after filter state is declared

  async function handleDeleteUser(userId: number) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchData()
        setDeleteUserId(null)
        toast({ title: 'User deleted', description: 'User and related data removed.' })
      }
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      toast({ title: 'Error', description: 'Failed to delete user' })
    }
  }

  function openCreateDialog() {
    setEditingUser({ role: 'student' })
    setIsDialogOpen(true)
  }

  // autofocus name input when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      // small timeout to allow dialog to mount
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [isDialogOpen])

  function openEditDialog(u: User) {
    setEditingUser(u)
    setIsDialogOpen(true)
  }

  async function handleSaveUser(formData: any) {
    // Clear previous errors
    setFormError(null)
    setFormFieldErrors({})
    // client-side validation
    const errors: Record<string, string> = {}
    const name = String(formData.name || "").trim()
    const email = String(formData.email || "").trim()
    const password = formData.password
    if (!name) errors.name = 'Name is required'
    if (!email) errors.email = 'Email is required'
    else {
      // basic email check
      const re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i
      if (!re.test(email)) errors.email = 'Invalid email'
    }
    // If creating new user, require a password
    const isEdit = !!(editingUser && editingUser.id)
    if (!isEdit && !password) errors.password = 'Password is required for new users'
    if (password && String(password).length > 0 && String(password).length < 6) errors.password = 'Password must be at least 6 characters'

    if (Object.keys(errors).length > 0) {
      setFormFieldErrors(errors)
      focusFirstError(errors)
      return
    }

    setIsSaving(true)
    try {
      if (isEdit) {
        // PATCH
        const res = await fetch(`/api/admin/users/${editingUser!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          setIsDialogOpen(false)
          setEditingUser(null)
          fetchData()
        } else {
          const data = await res.json().catch(() => ({}))
          const serverErrors: Record<string,string> = {}
          if (res.status === 409 && data && data.field) {
            serverErrors[data.field] = data.message || data.error || 'Conflict'
          } else if (data && data.errors) {
            Object.assign(serverErrors, data.errors)
          } else if (data && data.field && data.message) {
            serverErrors[data.field] = data.message
          } else {
            setFormError(data.error || 'Failed to update user')
          }
          if (Object.keys(serverErrors).length > 0) {
            setFormFieldErrors(serverErrors)
            focusFirstError(serverErrors)
          }
        }
      } else {
        // POST
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          setIsDialogOpen(false)
          setEditingUser(null)
          fetchData()
        } else {
          const data = await res.json().catch(() => ({}))
          const serverErrors: Record<string,string> = {}
          if (res.status === 409 && data && data.field) {
            serverErrors[data.field] = data.message || data.error || 'Conflict'
          } else if (data && data.errors) {
            Object.assign(serverErrors, data.errors)
          } else if (data && data.field && data.message) {
            serverErrors[data.field] = data.message
          } else {
            setFormError(data.error || 'Failed to create user')
          }
          if (Object.keys(serverErrors).length > 0) {
            setFormFieldErrors(serverErrors)
            focusFirstError(serverErrors)
          }
        }
      }
    } catch (err) {
      console.error('[v0] Error saving user', err)
      setFormError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  // Client-side form errors state
  const [formError, setFormError] = useState<string | null>(null)
  const [formFieldErrors, setFormFieldErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Users tab filters & refs for focusing
  const [userSearch, setUserSearch] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [classFilter, setClassFilter] = useState<number | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [classModalOpen, setClassModalOpen] = useState(false)
  const [modalClassId, setModalClassId] = useState<number | null>(null)
  const [modalClassName, setModalClassName] = useState<string>('')
  const [classModalSearch, setClassModalSearch] = useState<string>('')
  const [classModalIndex, setClassModalIndex] = useState<number>(0)
  const classListItemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const nameRef = useRef<HTMLInputElement | null>(null)
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)

  // Classes management UI state
  const [classesDialogOpen, setClassesDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<{ id?: number; name: string } | null>(null)

  // derived filtered users for UI
  const filteredUsers = users.filter(u => {
    const matchesSearch = userSearch === '' || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
    const matchesRole = roleFilter === '' || u.role === roleFilter
    const matchesClass = classFilter === null || (u.class_name && classesList.find(c=>c.name===u.class_name)?.id === classFilter)
    return matchesSearch && matchesRole && matchesClass
  })
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize)

  const classCounts = users.reduce((acc: Record<string, number>, u) => {
    const key = u.class_id ? String(u.class_id) : 'none'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  function toggleSelect(userId: number) {
    setSelectedUserIds(prev => (prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]))
  }

  function toggleSelectAll() {
    const allOnPage = paginatedUsers.every(u => selectedUserIds.includes(u.id))
    if (allOnPage) {
      // remove page ids
      setSelectedUserIds(prev => prev.filter(id => !paginatedUsers.some(u => u.id === id)))
    } else {
      setSelectedUserIds(prev => [...new Set([...prev, ...paginatedUsers.map(u => u.id)])])
    }
  }

  async function handleBulkUnassign() {
    if (!confirm('Unassign selected users from their classes?')) return
    try {
      await Promise.all(
        selectedUserIds.map(id => fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ class_id: null }) }))
      )
      setSelectedUserIds([])
      fetchData()
    } catch (err) {
      console.error('[v0] Error bulk unassigning', err)
    }
  }

  async function handleBulkDelete() {
    if (!confirm('Delete selected users? This is irreversible.')) return
    try {
      // delete sequentially to avoid DB locks
      for (const id of selectedUserIds) {
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      }
      setSelectedUserIds([])
      fetchData()
    } catch (err) {
      console.error('[v0] Error bulk deleting', err)
    }
  }

  async function handleChangeUserClass(userId: number, newClassId: number | null) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ class_id: newClassId }) })
      if (res.ok) fetchData()
      else console.error('[v0] Failed to change user class')
    } catch (err) {
      console.error('[v0] Error changing user class', err)
    }
  }

  function openClassModal(classId: number | null, name: string) {
    setModalClassId(classId)
    setModalClassName(name)
    setClassModalSearch('')
    setClassModalIndex(0)
    setClassModalOpen(true)
    // focus will be set after render
    setTimeout(() => classListItemRefs.current[0]?.focus(), 50)
  }

  const classMembers = users.filter(u => {
    if (modalClassId === null) return !u.class_id
    return (u.class_id ?? null) === modalClassId
  })

  const filteredClassMembers = classMembers.filter(u => {
    if (!classModalSearch) return true
    const q = classModalSearch.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  function handleRowKeyDown(e: React.KeyboardEvent, idx: number, userId: number) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = document.querySelector<HTMLElement>(`[data-row-index="${idx + 1}"]`)
      next?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = document.querySelector<HTMLElement>(`[data-row-index="${idx - 1}"]`)
      prev?.focus()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const user = users.find(u => u.id === userId)
      if (user) openEditDialog(user)
    }
  }
  async function handleCreateClass(name: string) {
    try {
      const res = await fetch('/api/admin/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
      if (res.ok) {
        setClassesDialogOpen(false)
        fetchClasses()
      } else {
        const data = await res.json().catch(() => ({}))
        setFormError(data.error || 'Failed to create class')
      }
    } catch (err) {
      console.error('[v0] Error creating class', err)
      setFormError('Failed to create class')
    }
  }

  async function handleDeleteClass(id: number) {
    if (!confirm('Delete this class? Users will be unassigned.')) return
    try {
      const res = await fetch(`/api/admin/classes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchClasses()
      } else {
        console.error('Failed to delete class')
      }
    } catch (err) {
      console.error('[v0] Error deleting class', err)
    }
  }

  async function handleDeleteTest(testId: number) {
    try {
      const response = await fetch(`/api/admin/tests/${testId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchData()
        setDeleteTestId(null)
      }
    } catch (error) {
      console.error("[v0] Error deleting test:", error)
    }
  }

  async function handleUnassignUser(userId: number) {
    if (!confirm('Remove this user from their class?')) return
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: null }),
      })
      if (res.ok) {
        fetchData()
      } else {
        console.error('[v0] Failed to unassign user')
      }
    } catch (err) {
      console.error('[v0] Error unassigning user', err)
    }
  }

  if (loading || !user || !stats) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">System Management & Analytics</p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_students} students, {stats.total_teachers} teachers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_tests}</div>
              <p className="text-xs text-muted-foreground">Created by teachers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_attempts}</div>
              <p className="text-xs text-muted-foreground">Completed tests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_score.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Across all tests</p>
            </CardContent>
          </Card>
        </div> */}

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="attempts">Test Attempts</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all system users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={openCreateDialog}>Add user</Button>
                </div>
                  <div className="flex gap-2 items-center mb-4">
                    <input aria-label="Search users" className="border px-2 py-1 rounded w-64" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                    <select aria-label="Filter by role" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border px-2 py-1 rounded">
                      <option value="">All roles</option>
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select aria-label="Filter by class" value={classFilter ?? ''} onChange={e => setClassFilter(e.target.value === '' ? null : Number(e.target.value))} className="border px-2 py-1 rounded">
                      <option value="">All classes</option>
                      {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="ml-2">
                      <Button variant="ghost" size="sm" onClick={() => { setUserSearch(''); setRoleFilter(''); setClassFilter(null); toast({ title: 'Filters cleared' }) }}>Clear filters</Button>
                    </div>
                  </div>
                  {/* Active filters */}
                  <div className="mb-4">
                    {userSearch && <span className="px-2 py-1 mr-2 rounded bg-blue-50 text-sm">Search: "{userSearch}"</span>}
                    {roleFilter && <span className="px-2 py-1 mr-2 rounded bg-blue-50 text-sm">Role: {roleFilter}</span>}
                    {classFilter !== null && <span className="px-2 py-1 mr-2 rounded bg-blue-50 text-sm">Class: {classesList.find(c => c.id === classFilter)?.name}</span>}
                  </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Classes</h3>
                  
                </div>
                <div className="mb-4">
                  <div className="flex gap-2 flex-wrap">
                    {classesList.map((c, idx) => (
                      <div key={c.id} className="px-3 py-1 rounded border bg-white flex items-center gap-2">
                        <button className="font-medium" onClick={() => { setClassFilter(c.id); setPage(1) }}>{c.name}</button>
                        <button className="text-sm text-muted-foreground ml-1" onClick={() => openClassModal(c.id, c.name)} aria-label={`View members of ${c.name}`}>{`(${classCounts[String(c.id)] ?? 0})`}</button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingClass({ id: c.id, name: c.name }); setClassesDialogOpen(true) }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClass(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {/* <div className="px-3 py-1 rounded border bg-white flex items-center gap-2">
                      <button className="font-medium" onClick={() => { setClassFilter(null); setPage(1) }}>Unassigned</button>
                      <button className="text-sm text-muted-foreground ml-1" onClick={() => openClassModal(null, 'Unassigned')} aria-label="View unassigned users">{` (${classCounts['none'] ?? 0})`}</button>
                    </div> */}
                    <div className="jusrtify-self-end">
                    <Button onClick={() => { setEditingClass({ name: '' }); setClassesDialogOpen(true) }}>
                      Create New Classes
                    </Button>
                  </div>
                  </div>
                </div>
                {/* Bulk action toolbar */}
                {selectedUserIds.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-sm">{selectedUserIds.length} selected</div>
                    <Button variant="outline" size="sm" onClick={handleBulkUnassign}>Unassign selected</Button>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>Delete selected</Button>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-4"><input type="checkbox" checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.includes(u.id))} onChange={() => toggleSelectAll()} /></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((u, idx) => (
                      <TableRow key={u.id} tabIndex={0} data-row-index={idx} onKeyDown={(e) => handleRowKeyDown(e as any, idx, u.id)}>
                        <TableCell className="w-4"><input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={() => toggleSelect(u.id)} aria-label={`Select ${u.name}`} /></TableCell>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.class_name ?? "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.role === "admin" ? "destructive" : u.role === "teacher" ? "default" : "secondary"
                            }
                          >
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(u)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {u.role !== "admin" && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleChangeUserClass(u.id, null)} title="Unassign from class">
                                  Unassign
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteUserId(u.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Pagination controls */}
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <label className="text-sm mr-2">Page size:</label>
                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }} className="border rounded px-2 py-1">
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
                    <div className="text-sm">Page {page} / {totalPages}</div>
                    <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          

          <TabsContent value="tests">
            <Card>
              <CardHeader>
                <CardTitle>Test Management</CardTitle>
                <CardDescription>View and manage all tests in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.title}</TableCell>
                        <TableCell>{test.teacher_name}</TableCell>
                        <TableCell>{test.question_count}</TableCell>
                        <TableCell>{test.duration_minutes} min</TableCell>
                        <TableCell>{test.attempt_count}</TableCell>
                        <TableCell>{new Date(test.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/test/${test.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTestId(test.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attempts">
            <Card>
              <CardHeader>
                <CardTitle>Test Attempts</CardTitle>
                <CardDescription>View all completed test attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium">{attempt.student_name}</TableCell>
                        <TableCell>{attempt.test_title}</TableCell>
                        <TableCell>{attempt.score}%</TableCell>
                        <TableCell>
                          <Badge variant={attempt.passed ? "default" : "destructive"}>
                            {attempt.passed ? "Passed" : "Failed"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(attempt.completed_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_users}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total_students} students, {stats.total_teachers} teachers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_tests}</div>
                  <p className="text-xs text-muted-foreground">Created by teachers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_attempts}</div>
                  <p className="text-xs text-muted-foreground">Completed tests</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.average_score.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Across all tests</p>
                </CardContent>
              </Card>
            </div>
{/* 
            <Card>
              <CardHeader>
                <CardTitle>Teacher Statistics</CardTitle>
                <CardDescription>Per-teacher tests, attempts and averages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2">Teacher</th>
                        <th className="p-2">Email</th>
                        <th className="p-2 text-center">Tests</th>
                        <th className="p-2 text-center">Attempts</th>
                        <th className="p-2 text-center">Avg Score</th>
                        <th className="p-2 text-center">Pass Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherStats.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No teacher data</td></tr>
                      ) : (
                        teacherStats.map(t => (
                          <tr key={t.teacher_id}>
                            <td className="p-2 font-medium">{t.teacher_name}</td>
                            <td className="p-2 text-sm text-muted-foreground">{t.teacher_email}</td>
                            <td className="p-2 text-center">{t.tests_count}</td>
                            <td className="p-2 text-center">{t.attempts_count}</td>
                            <td className="p-2 text-center">{Number(t.avg_score).toFixed(1)}%</td>
                            <td className="p-2 text-center">{Number(t.pass_rate).toFixed(1)}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card> */}
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={deleteUserId !== null} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user and all their associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteUserId && handleDeleteUser(deleteUserId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTestId !== null} onOpenChange={() => setDeleteTestId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this test, all its questions, and all student attempts. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTestId && handleDeleteTest(deleteTestId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Add/Edit user dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setEditingUser(null) } setIsDialogOpen(open) }}>
        <DialogTrigger asChild>
          {/* hidden trigger - we open programmatically */}
          <span />
        </DialogTrigger>
        <DialogContent>
          <div>
            <h3 className="text-lg font-medium">{editingUser && editingUser.id ? 'Edit User' : 'Create User'}</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const fm = new FormData(e.currentTarget as HTMLFormElement)
                const payload: any = {
                  email: fm.get('email'),
                  name: fm.get('name'),
                  role: fm.get('role'),
                  class_id: fm.get('class_id') ? Number(fm.get('class_id')) : undefined,
                }
                const pwd = fm.get('password')
                if (pwd) payload.password = pwd
                await handleSaveUser(payload)
              }}
            >
              <div className="grid gap-2">
                <label>Name</label>
                <Input name="name" defaultValue={editingUser?.name ?? ''} ref={nameRef} />
                {formFieldErrors.name && <div className="text-red-500 text-sm">{formFieldErrors.name}</div>}
                <label>Email</label>
                <Input name="email" defaultValue={editingUser?.email ?? ''} type="email" ref={emailRef} />
                {formFieldErrors.email && <div className="text-red-500 text-sm">{formFieldErrors.email}</div>}
                <label>Role</label>
                <select name="role" defaultValue={editingUser?.role ?? 'student'} className="border rounded-md px-2 py-1">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
                <label>Class</label>
                <select name="class_id" defaultValue={editingUser?.class_name ? String(classesList.find(c => c.name === editingUser.class_name)?.id ?? '') : ''} className="border rounded-md px-2 py-1">
                  <option value="">-- none --</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <label>Password <span className="text-xs text-muted-foreground">(leave blank to keep)</span></label>
                <Input name="password" type="password" ref={passwordRef} />
                {formFieldErrors.password && <div className="text-red-500 text-sm">{formFieldErrors.password}</div>}
                {formError && <div className="text-red-500 text-sm">{formError}</div>}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingUser(null) }}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      {/* Classes dialog */}
      <Dialog open={classesDialogOpen} onOpenChange={(open) => { if (!open) setEditingClass(null); setClassesDialogOpen(open) }}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent>
          <div>
            <h3 className="text-lg font-medium">{editingClass && editingClass.id ? 'Edit Class' : 'Create Class'}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fm = new FormData(e.currentTarget as HTMLFormElement);
              const name = (fm.get('class_name') || '').toString().trim();
              if (!name) { setFormError('Name required'); return }
              if (editingClass && editingClass.id) {
                // PATCH
                const res = await fetch(`/api/admin/classes/${editingClass.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
                if (res.ok) { setClassesDialogOpen(false); setEditingClass(null); fetchClasses() }
                else { const d = await res.json(); setFormError(d.error || 'Failed to update') }
              } else {
                await handleCreateClass(name)
              }
            }}>
              <div className="grid gap-2">
                <label>Class name</label>
                <Input name="class_name" defaultValue={editingClass?.name ?? ''} />
                {formError && <div className="text-red-500 text-sm">{formError}</div>}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setClassesDialogOpen(false); setEditingClass(null) }}>Cancel</Button>
                  <Button type="submit">Save</Button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      {/* Class members modal */}
      <Dialog open={classModalOpen} onOpenChange={(open) => { if (!open) setModalClassId(null); setClassModalOpen(open) }}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent>
          <div>
            <h3 className="text-lg font-medium">Members of {modalClassName}</h3>
            <div className="mt-2 mb-4">
              <input className="border px-2 py-1 w-full" placeholder="Search members..." value={classModalSearch} onChange={e => { setClassModalSearch(e.target.value); setClassModalIndex(0) }} />
            </div>
            <div className="max-h-64 overflow-auto">
              {filteredClassMembers.length === 0 && <div className="text-sm text-muted-foreground">No members</div>}
              {filteredClassMembers.map((m, i) => (
                <button
                  key={m.id}
                  ref={(el) => { classListItemRefs.current[i] = el }}
                  className={`w-full text-left px-2 py-2 hover:bg-slate-50 ${i === classModalIndex ? 'bg-slate-100' : ''}`}
                  onClick={() => openEditDialog(m)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setClassModalIndex(prev => Math.min(filteredClassMembers.length - 1, prev + 1)) }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setClassModalIndex(prev => Math.max(0, prev - 1)) }
                    if (e.key === 'Enter') { e.preventDefault(); openEditDialog(m) }
                  }}
                >
                  <div>{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setClassModalOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download } from "lucide-react"

export default function ClientTestAttempts({ testId }: { testId: number }) {
    const router = useRouter()
    const [attempts, setAttempts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [filterPass, setFilterPass] = useState<string>("")
    const [selected, setSelected] = useState<number[]>([])

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const res = await fetch(`/api/teacher/results/test/${testId}`)
                if (!res.ok) throw new Error("Failed")
                const data = await res.json()
                setAttempts(data.attempts || [])
            } catch (err) {
                setError("Failed to load attempts")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [testId])

    function downloadCSV(data: any[], filename: string) {
        const csvRows = [
            ["Attempt ID", "Student Name", "Student Email", "Score", "Passed", "Completed At"],
            ...data.map((r: any) => [r.attempt_id, r.student_name, r.student_email, r.score, r.passed ? "Yes" : "No", r.completed_at])
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

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <h1 className="text-2xl font-semibold">Results for Test {testId}</h1>
                {/* <div className="ml-auto">
                    <Button onClick={() => downloadCSV(attempts, `test-${testId}-results.csv`)}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div> */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-6">Loading...</div>
                    ) : error ? (
                        <div className="text-red-500">{error}</div>
                    ) : attempts.length === 0 ? (
                        <div className="text-center py-6">No attempts for this test yet.</div>
                    ) : (
                        <>
                            <div className="mb-4 flex gap-4 items-center">
                                <input type="text" placeholder="Search by student name or email" value={search} onChange={e => setSearch(e.target.value)} className="border px-2 py-1 rounded" />
                                <select value={filterPass} onChange={e => setFilterPass(e.target.value)} className="border px-2 py-1 rounded">
                                    <option value="">All</option>
                                    <option value="pass">Passed</option>
                                    <option value="fail">Failed</option>
                                </select>
                            </div>

                            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 mt-4">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-gray-100 text-gray-700 text-sm sticky top-0">
                                        <tr>
                                            <th className="p-3 w-10"></th>
                                            {/* <th className="p-3">Attempt ID</th> */}
                                            <th className="p-3">Student Name</th>
                                            <th className="p-3">Student Email</th>
                                            <th className="p-3 text-center">Score</th>
                                            <th className="p-3 text-center">Passed</th>
                                            <th className="p-3">Completed At</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y">
                                        {(() => {
                                            const filtered = attempts.filter((r: any) => {
                                                const matchesSearch = search === "" || r.student_name.toLowerCase().includes(search.toLowerCase()) || r.student_email.toLowerCase().includes(search.toLowerCase())
                                                const matchesPass = filterPass === "" || (filterPass === "pass" && r.passed) || (filterPass === "fail" && !r.passed)
                                                return matchesSearch && matchesPass
                                            })

                                            if (filtered.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={7} className="p-4 text-center text-gray-500">No results found.</td>
                                                    </tr>
                                                )
                                            }

                                            return filtered.map((r: any) => (
                                                <tr key={r.attempt_id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-3 text-center">
                                                        <input type="checkbox" checked={selected.includes(r.attempt_id)} onChange={() => {
                                                            setSelected(s => s.includes(r.attempt_id) ? s.filter((x: any) => x !== r.attempt_id) : [...s, r.attempt_id])
                                                        }} className="accent-blue-500" />
                                                    </td>
                                                    {/* <td className="p-3 font-medium text-gray-700">{r.attempt_id}</td> */}
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
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex gap-2 mb-2 mt-4">
                                <Button onClick={() => setSelected(attempts.map((a: any) => a.attempt_id))}>Select All</Button>
                                <Button onClick={() => setSelected([])}>Clear Selection</Button>
                                <Button onClick={() => downloadCSV(selected.length ? attempts.filter((a: any) => selected.includes(a.attempt_id)) : attempts, `test-${testId}-results.csv`)}>Export Selected to CSV</Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

function downloadCSV(data: any[], filename: string) {
    const csvRows = [
        ["Attempt ID", "Student Name", "Student Email", "Test Title", "Score", "Passed", "Completed At"],
        ...data.map(r => [
            r.attempt_id,
            r.student_name,
            r.student_email,
            r.test_title,
            r.score,
            r.passed ? "Yes" : "No",
            r.completed_at,
        ])
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

export default function TeacherResultsPage() {
    const [results, setResults] = useState<any[]>([])
    const [selected, setSelected] = useState<number[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [filterPass, setFilterPass] = useState<string>("")

    useEffect(() => {
        fetch("/api/teacher/results")
            .then(res => res.json())
            .then(data => {
                setResults(data.results || [])
                setLoading(false)
            })
            .catch(err => {
                setError("Failed to load results")
                setLoading(false)
            })
    }, [])

    // Statistics
    const totalAttempts = results.length
    const avgScore = totalAttempts ? (results.reduce((sum, r) => sum + r.score, 0) / totalAttempts).toFixed(2) : "-"
    const passRate = totalAttempts ? ((results.filter(r => r.passed).length / totalAttempts) * 100).toFixed(1) : "-"

    // Filtered results
    const filteredResults = results.filter(r => {
        const matchesSearch =
            r.student_name.toLowerCase().includes(search.toLowerCase()) ||
            r.test_title.toLowerCase().includes(search.toLowerCase())
        const matchesPass =
            filterPass === "" || (filterPass === "pass" && r.passed) || (filterPass === "fail" && !r.passed)
        return matchesSearch && matchesPass
    })

    const toggleSelect = (id: number) => {
        setSelected(sel => sel.includes(id) ? sel.filter(sid => sid !== id) : [...sel, id])
    }
    const selectAll = () => setSelected(filteredResults.map(r => r.attempt_id))
    const clearAll = () => setSelected([])
    const selectedResults = filteredResults.filter(r => selected.includes(r.attempt_id))

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>
            <Tabs defaultValue="results" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                    <TabsTrigger value="export">Export</TabsTrigger>
                </TabsList>

                <TabsContent value="results">
                    {error && <div className="text-red-500 mb-4">{error}</div>}#

                    <div className="mb-4 flex gap-4 items-center">
                        <input
                            type="text"
                            placeholder="Search by student or test title"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="border px-2 py-1 rounded"
                        />
                        <select value={filterPass} onChange={e => setFilterPass(e.target.value)} className="border px-2 py-1 rounded">
                            <option value="">All</option>
                            <option value="pass">Passed</option>
                            <option value="fail">Failed</option>
                        </select>
                    </div>
                    <table className="w-full mt-4 border">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Attempt ID</th>
                                <th>Student Name</th>
                                <th>Student Email</th>
                                <th>Test Title</th>
                                <th>Score</th>
                                <th>Passed</th>
                                <th>Completed At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8}>Loading...</td></tr>
                            ) : filteredResults.length === 0 ? (
                                <tr><td colSpan={8}>No results found.</td></tr>
                            ) : (
                                filteredResults.map(r => (
                                    <tr key={r.attempt_id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(r.attempt_id)}
                                                onChange={() => toggleSelect(r.attempt_id)}
                                            />
                                        </td>
                                        <td>{r.attempt_id}</td>
                                        <td>{r.student_name}</td>
                                        <td>{r.student_email}</td>
                                        <td>{r.test_title}</td>
                                        <td>{r.score}</td>
                                        <td>{r.passed ? "Yes" : "No"}</td>
                                        <td>{r.completed_at}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </TabsContent>

                <TabsContent value="stats">
                    <div className="mb-4 flex gap-8">
                        <div><b>Total Attempts:</b> {totalAttempts}</div>
                        <div><b>Average Score:</b> {avgScore}</div>
                        <div><b>Pass Rate:</b> {passRate}%</div>
                    </div>
                </TabsContent>

                <TabsContent value="export">
                    <div className="flex gap-2 mb-2">
                        <Button onClick={selectAll}>Select All</Button>
                        <Button onClick={clearAll}>Clear Selection</Button>
                        <Button onClick={() => downloadCSV(selectedResults.length ? selectedResults : filteredResults, "test-results.csv")}>Export Selected to CSV</Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

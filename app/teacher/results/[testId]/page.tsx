// Server component — read params synchronously and pass testId to the client component
import ClientTestAttempts from "./ClientTestAttempts"

export default async function TestAttemptsPage({ params }: { params: Promise<{ testId: string }> }) {
    const resolved = await params
    const testId = Number(resolved.testId)
    return <ClientTestAttempts testId={testId} />
}

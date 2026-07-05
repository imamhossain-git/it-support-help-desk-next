import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md text-center">
        <h1 className="text-3xl font-bold mb-2">404</h1>
        <p className="muted mb-6">Page not found.</p>
        <Link href="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    </main>
  );
}

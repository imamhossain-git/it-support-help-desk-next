"use client";

import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="card max-w-lg text-center">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="muted text-sm mb-4 break-words">{error.message}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={reset} className="btn btn-primary">Try Again</button>
              <Link href="/dashboard" className="btn btn-secondary">Dashboard</Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

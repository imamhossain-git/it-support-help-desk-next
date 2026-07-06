export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="spinner spinner-lg" />
      <p className="muted text-sm">Loading…</p>
    </div>
  );
}

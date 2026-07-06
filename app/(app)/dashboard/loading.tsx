export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24 gap-3">
      <div className="spinner spinner-lg" />
      <p className="muted text-sm">Loading…</p>
    </div>
  );
}

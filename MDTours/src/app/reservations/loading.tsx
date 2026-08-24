export default function ReservationsLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="h-24 animate-pulse rounded-2xl bg-white" />
          <div className="h-24 animate-pulse rounded-2xl bg-white" />
          <div className="h-24 animate-pulse rounded-2xl bg-white" />
        </div>
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-white" />
      </div>
    </main>
  );
}

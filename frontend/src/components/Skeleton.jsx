/** Esqueletos de carga: ocupar el mismo espacio que el contenido real sin saltos de layout. */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-tivit-red-light bg-white p-6">
      <div className="skeleton -mx-6 -mt-6 mb-5 h-1.5 rounded-t-2xl" />
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="skeleton h-4 w-16 rounded-full" />
        <span className="skeleton h-4 w-24 rounded-full" />
      </div>
      <div className="skeleton mt-4 h-5 w-3/4 rounded-full" />
      <div className="skeleton mt-3 h-3 w-full rounded-full" />
      <div className="skeleton mt-2 h-3 w-2/3 rounded-full" />
      <div className="skeleton mt-5 h-4 w-32 rounded-full" />
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-24">
      <div className="skeleton mt-6 h-5 w-56 rounded-full" />
      <div className="skeleton mt-6 h-8 w-1/3 rounded-full" />
      <div className="skeleton mt-4 h-4 w-2/3 rounded-full" />
      <div className="skeleton mt-10 h-5 w-32 rounded-full" />
      <div className="skeleton mt-4 h-24 w-full rounded-2xl" />
      <div className="mt-10 grid gap-12 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          <div className="skeleton h-5 w-40 rounded-full" />
          <div className="skeleton h-32 w-full rounded-2xl" />
          <div className="skeleton h-5 w-40 rounded-full" />
          <div className="skeleton h-28 w-full rounded-2xl" />
        </div>
        <div className="skeleton hidden h-72 rounded-2xl md:block" />
      </div>
    </div>
  );
}
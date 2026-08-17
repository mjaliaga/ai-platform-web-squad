export function VideoPlaceholder() {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-tivit-red-light bg-tivit-red-light/25 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-tivit-red" aria-hidden="true">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l9.58-6.86a1.03 1.03 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
        </svg>
      </span>
      <p className="font-semibold text-tivit-red-dark">Video promocional en preparación</p>
      <p className="max-w-md text-sm text-tivit-ink/60">
        Próximamente podrás conocer Mercado Público Management en funcionamiento.
      </p>
    </div>
  );
}
export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
      <img src="/heltog-logo.webp" alt="Heltog Technologies" className="h-9 w-auto opacity-90" />
      <span className="h-6 w-6 animate-spin rounded-full border-[2.5px] border-primary/20 border-t-primary" />
    </div>
  )
}

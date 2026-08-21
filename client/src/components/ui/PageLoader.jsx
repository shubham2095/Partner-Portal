import LoadingState from './LoadingState'

export default function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingState label="Loading page..." />
    </div>
  )
}

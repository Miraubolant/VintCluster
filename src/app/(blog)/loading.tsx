export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header skeleton */}
      <div className="mb-16 animate-pulse">
        <div className="h-16 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
      </div>

      {/* Featured article skeleton */}
      <div className="mb-16">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6" />
        <div className="border-4 border-gray-200 p-6 animate-pulse">
          <div className="md:flex gap-6">
            <div className="md:w-1/2 aspect-video bg-gray-200 mb-4 md:mb-0" />
            <div className="md:w-1/2">
              <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-10 bg-gray-200 rounded w-full mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>

      {/* Articles grid skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="border-4 border-gray-200 animate-pulse"
          >
            <div className="aspect-video bg-gray-200" />
            <div className="p-6">
              <div className="h-4 bg-gray-200 rounded w-20 mb-4" />
              <div className="h-6 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

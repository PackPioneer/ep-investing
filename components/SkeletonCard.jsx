export default function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-xl border animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
      <div className="h-6 bg-gray-300 rounded w-16"></div>
      <div className="h-3 bg-gray-200 rounded w-12 mt-3"></div>
    </div>
  );
}

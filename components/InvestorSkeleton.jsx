export default function InvestorSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-pulse">

      {/* Logo + Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-slate-200 rounded-md"></div>
        <div className="h-4 bg-slate-200 rounded w-32"></div>
      </div>

      {/* Type */}
      <div className="h-3 bg-slate-200 rounded w-24 mb-3"></div>

      {/* Tags */}
      <div className="flex gap-2">
        <div className="h-5 w-14 bg-slate-200 rounded-full"></div>
        <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
        <div className="h-5 w-12 bg-slate-200 rounded-full"></div>
      </div>

      {/* Button */}
      <div className="h-4 bg-slate-200 rounded w-24 mt-6"></div>
    </div>
  );
}
export function Loading() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1673FF] border-t-transparent"></div>
        <p className="mt-4 text-[#0A1C37] font-medium">Loading...</p>
      </div>
    </div>
  );
}

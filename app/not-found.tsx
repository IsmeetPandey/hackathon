import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-[#0F172A] px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#FF4500] text-white flex items-center justify-center font-bold text-xl mb-4 shadow-md">
        404
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Page Not Found</h1>
      <p className="text-sm text-[#64748B] mt-2 max-w-md">
        The requested campus resource, notice, or community does not exist or has been relocated.
      </p>
      <Link
        href="/"
        className="mt-6 px-4 py-2 bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-semibold rounded-lg shadow-sm transition"
      >
        Return to Campus Feed
      </Link>
    </div>
  );
}

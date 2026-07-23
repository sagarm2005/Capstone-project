import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">404 — Page Not Found</h1>
        </div>
        <p className="text-sm text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <Link href="/dashboard" className="px-4 py-2 bg-[#0d6e7e] text-white rounded-lg text-sm hover:bg-[#0a5566] transition-colors">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

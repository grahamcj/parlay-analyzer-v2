import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-100 mb-2">Loading MLB Data</h2>
        <p className="text-gray-400">Analyzing the latest odds and statistics...</p>
      </div>
    </div>
  );
}
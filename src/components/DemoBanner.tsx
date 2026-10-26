import React, { useState } from 'react';
import { Database, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { testSupabaseConnection } from '../services/supabaseClient.ts';

interface DemoBannerProps {
  isDemoMode: boolean;
  onRefresh: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ isDemoMode, onRefresh }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isDemoMode) {
    return null;
  }

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection();
    setTestResult(res.message);
    setTesting(false);
  };

  return (
    <div className="bg-amber-50/90 border-b border-amber-200 text-xs text-amber-900 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Demo Mode:</strong> Running with local sample campus grounds. Submissions update your session. To connect your live PostgreSQL database, add <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_URL</code> and <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code> to <code className="font-mono text-[11px]">.env</code>.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1"
          >
            <Database className="w-3 h-3 text-amber-700" />
            <span>{testing ? 'Testing...' : 'Check Supabase'}</span>
          </button>
          <button
            onClick={onRefresh}
            title="Reload ground data"
            className="p-1 hover:bg-amber-200 rounded text-amber-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {testResult && (
        <div className="max-w-7xl mx-auto mt-2 pt-1 border-t border-amber-200/60 text-[11px] text-amber-800 flex items-center gap-1.5 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-amber-700" />
          <span>{testResult}</span>
        </div>
      )}
    </div>
  );
};

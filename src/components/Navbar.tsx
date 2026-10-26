import React from 'react';
import { Activity, Plus, ShieldCheck, Database } from 'lucide-react';

interface NavbarProps {
  isDemoMode: boolean;
  onOpenReportModal: () => void;
  activeView: 'directory' | 'map';
  setActiveView: (view: 'directory' | 'map') => void;
  onOpenInfoModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDemoMode,
  onOpenReportModal,
  activeView,
  setActiveView,
  onOpenInfoModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#133E2B] whitespace-nowrap">
              <span className="w-8 h-8 rounded-lg bg-[#133E2B] text-emerald-400 flex items-center justify-center shadow-sm">
                <Activity className="w-4 h-4" />
              </span>
              <span>GroundPulse</span>
            </a>
            {isDemoMode ? (
              <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 whitespace-nowrap">
                Demo Mode
              </span>
            ) : (
              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 whitespace-nowrap flex items-center gap-1">
                <Database className="w-3 h-3" /> Supabase Connected
              </span>
            )}
          </div>

          {/* Zone 2: Navigation controls */}
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-stone-600">
            <button
              onClick={() => setActiveView('directory')}
              className={`hover:text-[#133E2B] transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'directory' ? 'text-[#133E2B] font-semibold border-b-2 border-[#133E2B] py-4' : 'py-4'
              }`}
            >
              Directory
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`hover:text-[#133E2B] transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'map' ? 'text-[#133E2B] font-semibold border-b-2 border-[#133E2B] py-4' : 'py-4'
              }`}
            >
              Campus Map
            </button>
            <button
              onClick={onOpenInfoModal}
              className="hover:text-[#133E2B] transition-colors whitespace-nowrap cursor-pointer py-4 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-stone-400" />
              <span>Freshness Rules</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#133E2B] hover:bg-[#0D2B1E] rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Report Availability</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

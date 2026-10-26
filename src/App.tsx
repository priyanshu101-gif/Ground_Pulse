import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Layers,
  Map as MapIcon,
  RefreshCw,
  AlertOctagon,
  Search,
  CheckCircle,
  HelpCircle,
  Navigation,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Ground, GroundStatus } from './types/index.ts';
import { getGrounds, GroundsFetchResult } from './services/groundService.ts';
import { determineEffectiveStatus } from './utils/statusUtils.ts';
import { Navbar } from './components/Navbar.tsx';
import { FilterBar } from './components/FilterBar.tsx';
import { GroundCard } from './components/GroundCard.tsx';
import { MapView } from './map/MapView.tsx';
import { ReportModal } from './components/ReportModal.tsx';
import { GroundDetailModal } from './components/GroundDetailModal.tsx';
import { FreshnessRulesModal } from './components/FreshnessRulesModal.tsx';
import { DemoBanner } from './components/DemoBanner.tsx';

export default function App() {
  // Navigation & View state
  const [activeView, setActiveView] = useState<'directory' | 'map'>('directory');

  // Ground data & fetching state
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<GroundStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'recently_reported' | 'distance'>('recently_reported');

  // Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportPreselectedGroundId, setReportPreselectedGroundId] = useState<string | null>(null);

  const [selectedGroundForDetail, setSelectedGroundForDetail] = useState<Ground | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [isFreshnessModalOpen, setIsFreshnessModalOpen] = useState<boolean>(false);

  // Focus ground on map
  const [focusedGroundIdOnMap, setFocusedGroundIdOnMap] = useState<string | null>(null);

  // Load grounds from service
  const loadGrounds = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const res: GroundsFetchResult = await getGrounds({
        searchQuery,
        selectedSport,
        selectedStatus,
        sortBy,
        userLocation,
      });

      if (res.error) {
        setFetchError(res.error);
        setGrounds([]);
      } else {
        setGrounds(res.grounds);
        setIsDemoMode(res.isDemoMode);
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to retrieve grounds');
      setGrounds([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedSport, selectedStatus, sortBy, userLocation]);

  useEffect(() => {
    loadGrounds();
  }, [loadGrounds]);

  // Request user geolocation for distance sorting
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setSortBy('distance');
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Distance sorting is disabled.');
        } else {
          setLocationError('Unable to determine location. Please try again.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Derive all unique sports across grounds
  const availableSports = useMemo(() => {
    const set = new Set<string>();
    grounds.forEach((g) => {
      g.supported_sports.forEach((s) => set.add(s));
    });
    return Array.from(set).sort();
  }, [grounds]);

  // Derive quick summary stats
  const stats = useMemo(() => {
    const now = new Date();
    let availableCount = 0;
    let occupiedCount = 0;
    let freshCount = 0;

    grounds.forEach((g) => {
      const eff = determineEffectiveStatus(g.latest_report, now);
      if (eff.effectiveStatus === 'Available') availableCount++;
      if (eff.effectiveStatus === 'Occupied') occupiedCount++;
      if (eff.freshness?.category === 'fresh') freshCount++;
    });

    return {
      total: grounds.length,
      available: availableCount,
      occupied: occupiedCount,
      freshReports: freshCount,
    };
  }, [grounds]);

  // Action handlers
  const handleOpenReportModal = (ground?: Ground) => {
    if (ground) {
      setReportPreselectedGroundId(ground.id);
    } else {
      setReportPreselectedGroundId(null);
    }
    setIsReportModalOpen(true);
  };

  const handleOpenDetailModal = (ground: Ground) => {
    setSelectedGroundForDetail(ground);
    setIsDetailModalOpen(true);
  };

  const handleFocusGroundOnMap = (ground: Ground) => {
    setFocusedGroundIdOnMap(ground.id);
    setActiveView('map');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSport('All');
    setSelectedStatus('All');
    setSortBy('recently_reported');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9F8] text-[#1E2922]">
      {/* Demo Banner */}
      <DemoBanner isDemoMode={isDemoMode} onRefresh={loadGrounds} />

      {/* Top Bar following Top Bar Contract */}
      <Navbar
        isDemoMode={isDemoMode}
        onOpenReportModal={() => handleOpenReportModal()}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenInfoModal={() => setIsFreshnessModalOpen(true)}
      />

      {/* Hero Strip */}
      <section className="bg-gradient-to-b from-white to-[#F8F9F8] border-b border-stone-200/80 pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#133E2B] mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Student-Powered Campus Ground Pulse</span>
                <span aria-hidden="true">·</span>
                <span className="text-stone-500 font-normal">Real crowd check-ins</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight mb-2">
                Find your ground. Know the game.
              </h1>
              <p className="text-sm text-stone-600 leading-relaxed">
                Discover campus athletic courts and turfs. View crowd-reported availability, check what sport is in progress, and report open fields for fellow students.
              </p>
            </div>

            {/* Quick Metrics Bar (Tabular Numerals) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-[11px] font-semibold text-stone-500 block">Grounds</span>
                <span className="text-xl font-extrabold text-stone-900 font-mono tabular-nums">
                  {stats.total}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Monitored</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
                <span className="text-[11px] font-semibold text-emerald-800 block">Available</span>
                <span className="text-xl font-extrabold text-emerald-700 font-mono tabular-nums">
                  {stats.available}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Reported Free</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-xs">
                <span className="text-[11px] font-semibold text-rose-800 block">Occupied</span>
                <span className="text-xl font-extrabold text-rose-700 font-mono tabular-nums">
                  {stats.occupied}
                </span>
                <span className="text-[10px] text-rose-600 block mt-0.5">Games active</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-[11px] font-semibold text-stone-500 block">Fresh Reports</span>
                <span className="text-xl font-extrabold text-[#133E2B] font-mono tabular-nums">
                  {stats.freshReports}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">&lt; 15 mins old</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* View Switcher on Mobile/Tablet */}
        <div className="flex sm:hidden items-center justify-between mb-4">
          <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-xl text-xs font-semibold w-full">
            <button
              onClick={() => setActiveView('directory')}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                activeView === 'directory'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600'
              }`}
            >
              Directory ({grounds.length})
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                activeView === 'map'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600'
              }`}
            >
              Interactive Map
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSport={selectedSport}
          onSportChange={setSelectedSport}
          availableSports={availableSports}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
          userLocation={userLocation}
          locationError={locationError}
          onResetFilters={handleResetFilters}
          totalCount={grounds.length}
        />

        {/* Database Error State (Surfaced cleanly with retry, never silently replaced by mock) */}
        {fetchError && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-rose-950">Database Connection Failed</h3>
            <p className="text-xs text-rose-800 max-w-md mx-auto leading-relaxed">
              {fetchError}
            </p>
            <button
              onClick={loadGrounds}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Database Connection</span>
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 animate-pulse"
              >
                <div className="flex justify-between">
                  <div className="h-5 bg-stone-200 rounded w-1/2"></div>
                  <div className="h-5 bg-stone-200 rounded w-1/4"></div>
                </div>
                <div className="h-3 bg-stone-100 rounded w-3/4"></div>
                <div className="h-3 bg-stone-100 rounded w-1/2"></div>
                <div className="pt-4 border-t border-stone-100 flex justify-between">
                  <div className="h-8 bg-stone-200 rounded w-24"></div>
                  <div className="h-8 bg-stone-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Views: Directory vs Map */}
        {!isLoading && !fetchError && (
          <>
            {activeView === 'directory' ? (
              grounds.length === 0 ? (
                /* Empty state */
                <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">No grounds match your criteria</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Try loosening your search query, selecting &ldquo;All Sports&rdquo;, or resetting your status filter.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                /* Responsive Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {grounds.map((ground) => (
                    <GroundCard
                      key={ground.id}
                      ground={ground}
                      onSelect={handleOpenDetailModal}
                      onReport={handleOpenReportModal}
                      onFocusOnMap={handleFocusGroundOnMap}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Map View */
              <div className="space-y-4">
                <div className="h-[600px] w-full">
                  <MapView
                    grounds={grounds}
                    selectedGroundId={focusedGroundIdOnMap}
                    onSelectGround={(id) => {
                      const ground = grounds.find((g) => g.id === id);
                      if (ground) handleOpenDetailModal(ground);
                    }}
                    userLocation={userLocation}
                    onLocateMe={handleLocateMe}
                    locationError={locationError}
                  />
                </div>
                {/* Note regarding non-GPS grounds */}
                <p className="text-[11px] text-stone-500 text-center">
                  Notice: Open areas without fixed geographic coordinates (e.g. general lawns) are visible in the Directory view and do not render fake map markers.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#133E2B]">GroundPulse</span>
            <span aria-hidden="true">·</span>
            <span>Find your ground. Know the game.</span>
          </div>
          <div className="flex items-center gap-4 text-stone-600">
            <button
              onClick={() => setIsFreshnessModalOpen(true)}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Freshness Guidelines
            </button>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px]">
              {isDemoMode ? 'Demo Session (Local)' : 'PostgreSQL RLS Protected'}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        grounds={grounds}
        preselectedGroundId={reportPreselectedGroundId}
        onReportSubmitted={loadGrounds}
        isDemoMode={isDemoMode}
      />

      <GroundDetailModal
        ground={selectedGroundForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedGroundForDetail(null);
        }}
        onOpenReport={handleOpenReportModal}
        onFocusMap={handleFocusGroundOnMap}
      />

      <FreshnessRulesModal
        isOpen={isFreshnessModalOpen}
        onClose={() => setIsFreshnessModalOpen(false)}
      />
    </div>
  );
}

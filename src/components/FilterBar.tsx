import React from 'react';
import { Search, RotateCcw, Crosshair, ArrowUpDown } from 'lucide-react';
import { GroundStatus } from '../types/index.ts';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSport: string;
  onSportChange: (sport: string) => void;
  availableSports: string[];
  selectedStatus: GroundStatus | 'All';
  onStatusChange: (status: GroundStatus | 'All') => void;
  sortBy: 'name' | 'recently_reported' | 'distance';
  onSortChange: (sort: 'name' | 'recently_reported' | 'distance') => void;
  onLocateMe: () => void;
  isLocating: boolean;
  userLocation: { lat: number; lng: number } | null;
  locationError: string | null;
  onResetFilters: () => void;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedSport,
  onSportChange,
  availableSports,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  onLocateMe,
  isLocating,
  userLocation,
  locationError,
  onResetFilters,
  totalCount,
}) => {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSport !== 'All' ||
    selectedStatus !== 'All' ||
    sortBy !== 'recently_reported';

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs mb-6 space-y-4">
      {/* Top row: Search input & Geolocation toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search grounds by name, area, or sport..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#133E2B] focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Locate me trigger */}
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          title="Sort by nearest ground using browser geolocation"
          className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            userLocation
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
          }`}
        >
          <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{userLocation ? 'Location Active' : isLocating ? 'Locating...' : 'Sort by Distance'}</span>
        </button>
      </div>

      {/* Location error notice if permission denied */}
      {locationError && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
          <span>{locationError}</span>
        </div>
      )}

      {/* Bottom controls: Status segmented tabs, Sport select, and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
        {/* Status segmented filters */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl text-xs font-medium">
          {(['All', 'Available', 'Occupied', 'Unknown'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === status
                  ? 'bg-white text-stone-900 font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Sport Dropdown & Sort selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sport filter */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <span className="font-medium text-stone-400">Sport:</span>
            <select
              value={selectedSport}
              onChange={(e) => onSportChange(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#133E2B] cursor-pointer"
            >
              <option value="All">All Sports</option>
              {availableSports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          {/* Sort order selector */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={(e) =>
                onSortChange(e.target.value as 'name' | 'recently_reported' | 'distance')
              }
              className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#133E2B] cursor-pointer"
            >
              <option value="recently_reported">Most Recently Reported</option>
              <option value="name">Ground Name (A-Z)</option>
              <option value="distance" disabled={!userLocation}>
                Distance (Closest) {!userLocation ? '(Enable Location)' : ''}
              </option>
            </select>
          </div>

          {/* Reset button if filtered */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Result count metadata */}
      <div className="text-[11px] text-stone-400 flex items-center justify-between">
        <span>Showing {totalCount} campus ground{totalCount === 1 ? '' : 's'} matching criteria</span>
        {userLocation && (
          <span className="text-emerald-700 font-medium">GPS location active</span>
        )}
      </div>
    </div>
  );
};

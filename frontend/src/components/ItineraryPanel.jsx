import React from 'react';
import { Clock, Bus, DollarSign, RefreshCw, Loader2, Star, Sunrise, Sun, Moon } from 'lucide-react';

const NPR_RATE = 133;

export default function ItineraryPanel({ itinerary, totalCost, confidence, destinations, highlights, onRegenerate, loading }) {
  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-gray-950">
        <div className="text-center text-gray-600">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-400">No itinerary yet</p>
          <p className="text-sm mt-1 text-gray-600">Submit your preferences to generate one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-gradient-to-r from-purple-950/30 to-gray-950">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white">Your Itinerary</h2>
          <button onClick={onRegenerate} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 disabled:opacity-40 transition-all">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Regenerate
          </button>
        </div>
        {destinations && destinations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {destinations.map((d) => (
              <span key={d} className="text-xs font-medium bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">{d}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 text-sm">
          {totalCost != null && (
            <span className="flex items-center gap-1 text-gray-300 font-medium">
              <DollarSign className="w-3.5 h-3.5" /> ${totalCost} USD
            </span>
          )}
          {confidence != null && (
            <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full text-xs font-semibold border border-green-500/20">
              <Star className="w-3 h-3" /> {Math.round(confidence * 100)}% match
            </span>
          )}
        </div>
      </div>

      {/* Day cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {itinerary.map((day, i) => (
          <div key={day.day} className={`rounded-xl border border-white/5 overflow-hidden ${i % 2 === 0 ? 'bg-gray-900/60' : 'bg-gray-900/30'}`}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 text-white text-sm font-bold flex-shrink-0 shadow-lg shadow-purple-500/20">
                  D{day.day}
                </span>
                <h3 className="font-semibold text-gray-100 text-sm leading-tight">{day.title}</h3>
              </div>
              <div className="space-y-2 ml-[52px]">
                <div className="flex gap-2">
                  <Sunrise className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-400 leading-relaxed">{day.morning}</p>
                </div>
                <div className="flex gap-2">
                  <Sun className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-400 leading-relaxed">{day.afternoon}</p>
                </div>
                <div className="flex gap-2">
                  <Moon className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-400 leading-relaxed">{day.evening}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 ml-[52px]">
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full border border-white/5">
                  <Bus className="w-3 h-3" /> {day.transport}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full border border-white/5">
                  <DollarSign className="w-3 h-3" /> ${day.cost_usd}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-gray-900/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Total Cost</span>
          <div className="text-right">
            <span className="font-bold text-white">${totalCost || 0} USD</span>
            <span className="text-gray-600 ml-2 text-xs">({'\u2248'} NPR {((totalCost || 0) * NPR_RATE).toLocaleString()})</span>
          </div>
        </div>
        {highlights && highlights.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Highlights</p>
            <ul className="space-y-1">
              {highlights.map((h, i) => (
                <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                  <Star className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

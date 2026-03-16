import React, { useState } from 'react';
import axios from 'axios';
import { Bus, DollarSign, RefreshCw, Loader2, Star, Sunrise, Sun, Moon, Sparkles, Lightbulb, AlertTriangle } from 'lucide-react';

const NPR_RATE = 133;

export default function ItineraryPanel({
  itinerary,
  totalCost,
  confidence,
  destinations,
  highlights,
  aiSummary,
  aiTips,
  aiEnhanced,
  onRegenerate,
  onConnectGuide,
  loading,
  aiRateLimited,
}) {

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
          <div>
            <h2 className="text-lg font-bold text-white">Your Itinerary</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Powered by a hybrid AI engine: ML ranking + GPT narrative.
            </p>
          </div>
          <button onClick={onRegenerate} disabled={loading || aiRateLimited}
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

      {/* AI Summary Section */}
      {aiEnhanced && aiSummary && (
        <div className="mx-4 mt-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300 uppercase">AI-Powered Insight</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{aiSummary}</p>
          {aiTips && aiTips.length > 0 && (
            <div className="mt-2 pt-2 border-t border-purple-500/10 space-y-1.5">
              {aiTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <Lightbulb className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-400 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fallback notice when AI is unavailable but ML itinerary exists */}
      {!aiEnhanced && aiSummary && (
        <div className="mx-4 mt-3 p-3 bg-amber-500/5 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300 uppercase">
              AI Enhancements Temporarily Limited
            </span>
          </div>
          <p className="text-xs text-amber-100/90 leading-relaxed">
            {aiSummary}
          </p>
        </div>
      )}

      {/* Day cards - let the parent column handle scrolling to avoid nested tiny scroll area */}
      <div className="flex-1 p-4 space-y-3">
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
                <button
                  type="button"
                  onClick={() => onConnectGuide && onConnectGuide(day)}
                  className="ml-auto text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  Connect with a local guide
                </button>
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
        {aiRateLimited && (
          <p className="mt-2 text-[11px] text-amber-500 text-right">
            AI usage is temporarily rate-limited. Please wait about a minute before regenerating.
          </p>
        )}
      </div>

    </div>
  );
}

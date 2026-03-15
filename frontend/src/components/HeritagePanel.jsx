import React from 'react';
import { X, Star, AlertTriangle, Clock, Award, Users, Heart, MapPin, Sparkles, Camera } from 'lucide-react';

export default function HeritagePanel({ site, onClose }) {
  if (!site) return null;

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-gradient-to-r from-purple-950/40 to-gray-950">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{site.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">{site.type}</span>
              {site.unesco && (
                <span className="text-xs font-medium bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <Award className="w-3 h-3" /> UNESCO
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {site.location}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Entry fees */}
        {site.entry_fee_usd && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Entry Fees</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Foreigner', key: 'foreigner' },
                { label: 'SAARC', key: 'saarc' },
                { label: 'Nepali', key: 'nepali' },
              ].map(({ label, key }) => (
                <div key={key} className="text-center bg-gray-900 rounded-lg p-2 border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase">{label}</p>
                  <p className="text-sm font-bold text-gray-200">
                    {site.entry_fee_usd[key] === 0 ? 'Free' : `$${site.entry_fee_usd[key]}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best time */}
        {site.best_visit_time && (
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-semibold text-teal-400 uppercase">Best Time to Visit</h3>
            </div>
            <p className="text-xs text-teal-200/80 leading-relaxed">{site.best_visit_time}</p>
            {site.duration_hours && (
              <p className="text-xs text-teal-400/60 mt-1">Recommended duration: {site.duration_hours} hours</p>
            )}
          </div>
        )}

        {/* Story */}
        {/* AI-Generated Narrative */}
        {site.ai_story && (
          <div className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-semibold text-purple-300 uppercase">AI-Powered Narrative</h3>
            </div>
            {site.ai_story.ai_narrative && (
              <p className="text-xs text-gray-300 leading-relaxed mb-2">{site.ai_story.ai_narrative}</p>
            )}
            {site.ai_story.hidden_insight && (
              <p className="text-xs text-amber-300/80 leading-relaxed"><span className="font-semibold">Hidden insight:</span> {site.ai_story.hidden_insight}</p>
            )}
            {site.ai_story.best_photo_spot && (
              <p className="text-xs text-cyan-300/80 leading-relaxed mt-1 flex items-start gap-1">
                <Camera className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Best photo spot:</span> {site.ai_story.best_photo_spot}</span>
              </p>
            )}
          </div>
        )}

        {/* Cultural Story */}
        {site.story && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Cultural Story</h3>
            <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3">
              <p className="text-xs text-gray-300 leading-relaxed">{site.story}</p>
            </div>
          </div>
        )}

        {/* Etiquette */}
        {site.etiquette && site.etiquette.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Etiquette Tips</h3>
            <div className="space-y-2">
              {site.etiquette.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-300 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Local secret */}
        {site.locals_secret && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-amber-400 uppercase">What Most Tourists Miss</h3>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed">{site.locals_secret}</p>
          </div>
        )}

        {/* Tourists vs Locals */}
        {(site.tourists_visit || site.locals_love) && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Tourists vs Locals</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-[10px] font-bold text-blue-400 uppercase">Tourists Visit</p>
                </div>
                <p className="text-xs text-blue-200/70 leading-relaxed">{site.tourists_visit}</p>
              </div>
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <p className="text-[10px] font-bold text-rose-400 uppercase">Locals Love</p>
                </div>
                <p className="text-xs text-rose-200/70 leading-relaxed">{site.locals_love}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nearby hidden spots */}
        {site.nearby_hidden && site.nearby_hidden.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Nearby Hidden Spots</h3>
            <div className="flex flex-wrap gap-1.5">
              {site.nearby_hidden.map((place, i) => (
                <span key={i} className="text-xs bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/20 font-medium">
                  {place}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

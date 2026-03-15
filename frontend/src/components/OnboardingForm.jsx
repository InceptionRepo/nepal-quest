import React, { useState } from 'react';
import {
  Calendar, Heart, Dumbbell, Wallet, MapPin,
  ChevronRight, ChevronLeft, Loader2,
  Landmark, Mountain, TreePine, Sparkles, Coffee, Eye, Footprints
} from 'lucide-react';

const DURATION_OPTIONS = [3, 5, 7, 10, 14];

const INTEREST_OPTIONS = [
  { value: 'heritage', label: 'Heritage', icon: Landmark },
  { value: 'trekking', label: 'Trekking', icon: Mountain },
  { value: 'wildlife', label: 'Wildlife', icon: TreePine },
  { value: 'spiritual', label: 'Spiritual', icon: Sparkles },
  { value: 'relaxation', label: 'Relaxation', icon: Coffee },
  { value: 'food', label: 'Food', icon: Coffee },
  { value: 'hidden_gems', label: 'Hidden Gems', icon: Eye },
  { value: 'adventure', label: 'Adventure', icon: Footprints },
];

const FITNESS_OPTIONS = [
  { level: 1, label: 'Easy', desc: 'City walks & light sightseeing. Suitable for all ages and abilities.' },
  { level: 2, label: 'Moderate', desc: 'Light hiking & day treks up to 6 hours. Some uphill walking required.' },
  { level: 3, label: 'High', desc: 'Serious multi-day trekking at altitude. Good physical fitness needed.' },
];

const BUDGET_OPTIONS = [
  { value: 'low', label: 'Budget', desc: 'Under $300', range: 'Hostels, local food, public buses' },
  { value: 'medium', label: 'Mid-range', desc: '$300 – $900', range: 'Hotels, restaurants, private transport' },
  { value: 'high', label: 'Premium', desc: '$900+', range: 'Luxury lodges, guided tours, flights' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const AGE_GROUPS = ['youth', 'adult', 'senior', 'family'];
const STEP_LABELS = ['Duration', 'Interests', 'Fitness', 'Budget', 'When & Who'];

export default function OnboardingForm({ onSubmit, loading }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    duration_days: 7,
    interests: [],
    fitness_level: 2,
    budget: 'medium',
    travel_month: 'Oct',
    age_group: 'adult',
  });

  const toggleInterest = (val) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(val)
        ? prev.interests.filter((i) => i !== val)
        : [...prev.interests, val],
    }));
  };

  const canNext = () => {
    if (step === 0) return form.duration_days > 0;
    if (step === 1) return form.interests.length > 0;
    if (step === 2) return form.fitness_level > 0;
    if (step === 3) return form.budget !== '';
    if (step === 4) return form.travel_month !== '' && form.age_group !== '';
    return true;
  };

  const handleSubmit = () => {
    if (canNext()) onSubmit(form);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8 relative">
      {/* Purple ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(120,119,198,0.15),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-[linear-gradient(180deg,#FFF_0%,rgba(255,255,255,0.4)_100%)] mb-2">
            Plan Your Nepal Adventure
          </h1>
          <p className="text-gray-400">Our AI will craft a personalized itinerary just for you</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                i < step ? 'bg-purple-600 text-white' :
                i === step ? 'bg-purple-600 text-white ring-4 ring-purple-600/20' :
                'bg-gray-800 text-gray-500'
              }`}>
                {i + 1}
              </div>
              <span className={`hidden sm:inline text-xs font-medium ${
                i <= step ? 'text-purple-400' : 'text-gray-600'
              }`}>{label}</span>
              {i < STEP_LABELS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? 'bg-purple-600' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-white/5 p-6 sm:p-8 glow-purple">
          {/* Step 1 — Duration */}
          {step === 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">How many days in Nepal?</h2>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {DURATION_OPTIONS.map((d) => (
                  <button key={d} onClick={() => setForm({ ...form, duration_days: d })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      form.duration_days === d
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300 shadow-lg shadow-purple-500/10'
                        : 'border-white/5 hover:border-purple-500/30 text-gray-300 bg-gray-800/50'
                    }`}>
                    <div className="text-2xl font-bold">{d}</div>
                    <div className="text-xs mt-1 text-gray-500">days</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Interests */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">What interests you?</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">Select one or more</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {INTEREST_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button key={value} onClick={() => toggleInterest(value)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      form.interests.includes(value)
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300 shadow-lg shadow-purple-500/10'
                        : 'border-white/5 hover:border-purple-500/30 text-gray-300 bg-gray-800/50'
                    }`}>
                    <Icon className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Fitness */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Your fitness level?</h2>
              </div>
              <div className="space-y-3">
                {FITNESS_OPTIONS.map(({ level, label, desc }) => (
                  <button key={level} onClick={() => setForm({ ...form, fitness_level: level })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      form.fitness_level === level
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                        : 'border-white/5 hover:border-purple-500/30 bg-gray-800/50'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-semibold ${form.fitness_level === level ? 'text-purple-300' : 'text-gray-200'}`}>{label}</div>
                        <div className="text-sm text-gray-500 mt-1">{desc}</div>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((dot) => (
                          <div key={dot} className={`w-3 h-3 rounded-full ${dot <= level ? 'bg-purple-500' : 'bg-gray-700'}`} />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 — Budget */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Your budget range?</h2>
              </div>
              <div className="space-y-3">
                {BUDGET_OPTIONS.map(({ value, label, desc, range }) => (
                  <button key={value} onClick={() => setForm({ ...form, budget: value })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      form.budget === value
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                        : 'border-white/5 hover:border-purple-500/30 bg-gray-800/50'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-semibold ${form.budget === value ? 'text-purple-300' : 'text-gray-200'}`}>{label}</div>
                        <div className="text-sm text-gray-500">{range}</div>
                      </div>
                      <div className={`text-lg font-bold ${form.budget === value ? 'text-purple-300' : 'text-gray-600'}`}>{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 — Month & Age */}
          {step === 4 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">When are you traveling?</h2>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Travel Month</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {MONTHS.map((m) => (
                    <button key={m} onClick={() => setForm({ ...form, travel_month: m })}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                        form.travel_month === m
                          ? 'border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                          : 'border-white/5 hover:border-purple-500/30 text-gray-400 bg-gray-800/50'
                      }`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Traveler Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AGE_GROUPS.map((ag) => (
                    <button key={ag} onClick={() => setForm({ ...form, age_group: ag })}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                        form.age_group === ag
                          ? 'border-purple-500 bg-purple-500/10 text-purple-300 shadow-lg shadow-purple-500/10'
                          : 'border-white/5 hover:border-purple-500/30 text-gray-400 bg-gray-800/50'
                      }`}>
                      {ag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button onClick={() => canNext() && setStep(step + 1)}
                disabled={!canNext()}
                className="flex items-center gap-2 px-6 py-2.5 font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all relative overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 group-hover:from-purple-500 group-hover:to-purple-400 transition-all" />
                <span className="relative flex items-center gap-2 text-white">Next <ChevronRight className="w-4 h-4" /></span>
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!canNext() || loading}
                className="flex items-center gap-2 px-6 py-2.5 font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all relative overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 group-hover:from-purple-500 group-hover:to-purple-400 transition-all" />
                <span className="relative flex items-center gap-2 text-white">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <>Generate Itinerary <ChevronRight className="w-4 h-4" /></>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useCallback } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import { HeroSection } from './components/ui/hero-section-dark';
import OnboardingForm from './components/OnboardingForm';
import NepalMap from './components/NepalMap';
import ItineraryPanel from './components/ItineraryPanel';
import HeritagePanel from './components/HeritagePanel';

const HERITAGE_SITE_IDS = ['PSP', 'BDN', 'PTN', 'SYM', 'LMT'];

export default function App() {
  const [view, setView] = useState('landing');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [itineraryData, setItineraryData] = useState(null);
  const [heritageSite, setHeritageSite] = useState(null);
  const [showHeritage, setShowHeritage] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Oct');

  const fetchItinerary = useCallback(async (profile) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/itinerary', profile);
      setItineraryData(res.data);
      setView('dashboard');
    } catch (err) {
      console.error('Failed to fetch itinerary:', err);
      alert('Failed to generate itinerary. Please make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFormSubmit = (form) => {
    setUserProfile(form);
    setSelectedMonth(form.travel_month || 'Oct');
    fetchItinerary(form);
  };

  const handleRegenerate = () => {
    if (userProfile) {
      fetchItinerary(userProfile);
    }
  };

  const handleHeritageClick = async (siteId) => {
    try {
      const res = await axios.get(`/api/heritage/${siteId}`);
      setHeritageSite(res.data);
      setShowHeritage(true);
    } catch (err) {
      console.error('Failed to fetch heritage site:', err);
    }
  };

  const handleCloseHeritage = () => {
    setShowHeritage(false);
    setHeritageSite(null);
  };

  const handleLogoClick = () => {
    setView('landing');
  };

  // Landing page with HeroSection
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <Navbar onLogoClick={handleLogoClick} />
        <HeroSection
          title="Nepal Quest"
          subtitle={{
            regular: 'Plan your journey through ',
            gradient: 'the Himalayas and beyond',
          }}
          description="AI-powered travel intelligence for Nepal. Build a personalized itinerary, explore cultural heritage, and discover crowd-free destinations with real-time heatmaps."
          ctaText="Start Planning"
          onCtaClick={() => setView('onboarding')}
          bottomImage="https://images.unsplash.com/photo-1544735716-5b136d1f61f0?auto=format&fit=crop&w=2400&q=80"
          gridOptions={{
            angle: 65,
            opacity: 0.4,
            cellSize: 50,
            lightLineColor: '#4a4a4a',
            darkLineColor: '#2a2a2a',
          }}
        />
        {/* Feature cards */}
        <div className="max-w-screen-xl mx-auto px-4 pb-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'AI Itinerary Engine',
                desc: 'Random Forest ML model analyzes your preferences to generate the perfect day-by-day Nepal itinerary.',
                accent: 'from-purple-500 to-pink-500',
              },
              {
                title: 'Crowd Heatmap',
                desc: 'Predict crowd density at any destination for any month. Color-coded interactive map of all Nepal.',
                accent: 'from-green-400 to-cyan-400',
              },
              {
                title: 'Heritage Storyteller',
                desc: 'Deep cultural stories, etiquette tips, and local secrets for UNESCO World Heritage Sites.',
                accent: 'from-amber-400 to-orange-400',
              },
            ].map((card) => (
              <div key={card.title} className="bg-gray-900/60 border border-white/5 rounded-xl p-6 hover:border-purple-500/20 transition-all group">
                <div className={`w-10 h-1 rounded-full bg-gradient-to-r ${card.accent} mb-4`} />
                <h3 className="text-white font-semibold mb-2 group-hover:text-purple-300 transition-colors">{card.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Onboarding form
  if (view === 'onboarding') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <Navbar onLogoClick={handleLogoClick} />
        <OnboardingForm onSubmit={handleFormSubmit} loading={loading} />
      </div>
    );
  }

  // Loading state
  if (view === 'dashboard' && loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <Navbar onLogoClick={handleLogoClick} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Generating your perfect Nepal itinerary...</p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <Navbar onLogoClick={handleLogoClick} />
      <div className="flex-1 flex overflow-hidden">
        {/* Map — left 60% */}
        <div className="w-[60%] h-full border-r border-white/5">
          <NepalMap
            onHeritageClick={handleHeritageClick}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            heritageSiteIds={HERITAGE_SITE_IDS}
          />
        </div>

        {/* Right panel — 40% */}
        <div className="w-[40%] h-full overflow-hidden">
          {showHeritage && heritageSite ? (
            <HeritagePanel site={heritageSite} onClose={handleCloseHeritage} />
          ) : (
            <ItineraryPanel
              itinerary={itineraryData?.itinerary || []}
              totalCost={itineraryData?.total_cost_usd}
              confidence={itineraryData?.confidence_score}
              destinations={itineraryData?.destinations_used}
              highlights={itineraryData?.highlights}
              onRegenerate={handleRegenerate}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

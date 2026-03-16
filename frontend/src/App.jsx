import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { MapPin, Sparkles } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { HeroSection } from './components/ui/hero-section-dark';
import OnboardingForm from './components/OnboardingForm';
import NepalMap from './components/NepalMap';
import ItineraryPanel from './components/ItineraryPanel';
import HeritagePanel from './components/HeritagePanel';
import AuthModal from './components/AuthModal';
import GuideRequestsPanel from './components/GuideRequestsPanel';

const HERITAGE_SITE_IDS = ['PSP', 'BDN', 'PTN', 'SYM', 'LMT'];

function App() {
  const { isAuthenticated, isGuide } = useAuth();
  const [view, setView] = useState('landing');
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(false);
  const [aiRateLimited, setAiRateLimited] = useState(false);
  const [rateLimitNotified, setRateLimitNotified] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [itineraryData, setItineraryData] = useState(null);
  const [heritageSite, setHeritageSite] = useState(null);
  const [showHeritage, setShowHeritage] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Oct');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [requestsPanelShowCreateForm, setRequestsPanelShowCreateForm] = useState(false);
  const [requestsPanelInitialFormData, setRequestsPanelInitialFormData] = useState(null);

  // If the user logs out while panels/modals are open, close request panel to avoid 401 spam.
  React.useEffect(() => {
    if (!isAuthenticated) {
      setShowRequestsPanel(false);
      setRequestsPanelShowCreateForm(false);
      setRequestsPanelInitialFormData(null);
    }
  }, [isAuthenticated]);

  const fetchItinerary = useCallback(async (profile) => {
    if (!isAuthenticated) {
      setAuthInitialMode('login');
      setShowAuthModal(true);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/itinerary', profile);
      setItineraryData(res.data);
      setView('dashboard');
    } catch (err) {
      console.error('Failed to fetch itinerary:', err);
      if (err.response && err.response.status === 401) {
        setAuthInitialMode('login');
        setShowAuthModal(true);
        return;
      }
      if (err.response && err.response.status === 429) {
        setAiRateLimited(true);
        if (!rateLimitNotified) {
          alert('Rate limit reached. Please wait about a minute before generating another itinerary.');
          setRateLimitNotified(true);
        }
        // Soft cooldown: re-enable after 60 seconds so the user can try again later
        setTimeout(() => {
          setAiRateLimited(false);
        }, 60000);
      } else {
        alert('Failed to generate itinerary. Please make sure the backend is running on port 5000.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, rateLimitNotified]);

  const handleFormSubmit = (form) => {
    if (!isAuthenticated) {
      setAuthInitialMode('login');
      setShowAuthModal(true);
      return;
    }
    setUserProfile(form);
    setSelectedMonth(form.travel_month || 'Oct');
    // When user (re)generates a trip, focus the itinerary view
    setShowHeritage(false);
    setHeritageSite(null);
    fetchItinerary(form);
  };

  const handleRegenerate = () => {
    if (userProfile) {
      if (!isAuthenticated) {
        setAuthInitialMode('login');
        setShowAuthModal(true);
        return;
      }
      // Regenerating should also focus on the itinerary, not a previously opened heritage card
      setShowHeritage(false);
      setHeritageSite(null);
      fetchItinerary(userProfile);
    }
  };

  const handleHeritageClick = async (siteId) => {
    try {
      const interests = userProfile?.interests?.join(',') || '';
      const res = await axios.get(`/api/heritage/${siteId}?interests=${interests}`);
      setHeritageSite(res.data);
      setShowHeritage(true);
    } catch (err) {
      console.error('Failed to fetch heritage site:', err);
      if (err.response && err.response.status === 429) {
        setAiRateLimited(true);
        if (!rateLimitNotified) {
          alert('Rate limit reached. Please wait about a minute before requesting more AI-powered stories.');
          setRateLimitNotified(true);
        }
        setTimeout(() => {
          setAiRateLimited(false);
        }, 60000);
      }
    }
  };

  const handleCloseHeritage = () => {
    setShowHeritage(false);
    setHeritageSite(null);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next === 'dark');
      }
      return next;
    });
  };

  const handleNavigate = (target) => {
    if (target === 'landing') {
      setView('landing');
      setShowHeritage(false);
      setHeritageSite(null);
    } else if (target === 'onboarding') {
      setView('onboarding');
      setShowHeritage(false);
      setHeritageSite(null);
    } else if (target === 'dashboard') {
      setShowHeritage(false);
      setView('dashboard');
    } else if (target === 'guide-requests' || target === 'my-requests') {
      setView('requests');
    }
  };

  const openRequestsList = () => {
    if (!isAuthenticated) {
      setAuthInitialMode('login');
      setShowAuthModal(true);
      return;
    }
    setRequestsPanelShowCreateForm(false);
    setRequestsPanelInitialFormData(null);
    setShowRequestsPanel(true);
  };

  const openRequestsCreateFromDay = (day) => {
    if (!isAuthenticated) {
      setAuthInitialMode('login');
      setShowAuthModal(true);
      return;
    }
    const message = [
      `I'm interested in connecting with a local guide for Day ${day?.day}: ${day?.title}`,
      day?.morning ? `Morning: ${day.morning}` : null,
      day?.afternoon ? `Afternoon: ${day.afternoon}` : null,
      day?.evening ? `Evening: ${day.evening}` : null,
      day?.transport ? `Transport: ${day.transport}` : null,
      day?.cost_usd != null ? `Approx. budget: $${day.cost_usd} USD` : null,
    ].filter(Boolean).join('\n\n');

    setRequestsPanelShowCreateForm(true);
    setRequestsPanelInitialFormData({
      tripTitle: day?.title || 'Trip request',
      message,
    });
    setShowRequestsPanel(true);
  };

  const navProps = {
    onLogoClick: () => setView('landing'),
    currentView: view,
    onNavigate: handleNavigate,
    theme,
    onToggleTheme: handleToggleTheme,
    onOpenAuth: (mode = 'login') => {
      setAuthInitialMode(mode);
      setShowAuthModal(true);
    },
    // Dropdown "My Requests" should show only the list (no create form)
    onOpenRequests: openRequestsList,
  };

  // Landing page
  if (view === 'landing') {
    return (
      <div className={theme === 'dark' ? 'min-h-screen bg-gray-950 flex flex-col' : 'min-h-screen bg-slate-50 flex flex-col'}>
        <Navbar {...navProps} />
        <HeroSection
          title="Powered by GPT-5.4 + ML"
          subtitle={{
            regular: 'Plan your journey through ',
            gradient: 'the Himalayas and beyond',
          }}
          description="AI-powered travel intelligence for Nepal. GPT-5.4 generates personalized itineraries, Random Forest ML predicts crowd levels, and AI storytelling brings heritage sites to life."
          ctaText="Start Planning"
          onCtaClick={() => setView('onboarding')}
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
                desc: 'Rule-based scoring + Random Forest classifier selects destinations, then GPT-5.4 generates personalized trip summaries and insider tips.',
                accent: 'from-purple-500 to-pink-500',
              },
              {
                title: 'Crowd Heatmap + AI Advice',
                desc: 'Random Forest regressor predicts crowd density. GPT-5.4 generates smart crowd-avoidance advice for each destination and month.',
                accent: 'from-green-400 to-cyan-400',
              },
              {
                title: 'AI Heritage Storyteller',
                desc: 'GPT-5.4 creates personalized cultural narratives, hidden insights, and best photo spots for UNESCO World Heritage Sites.',
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

        {/* Auth Modal & Guide Requests available on landing view */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authInitialMode}
        />
        <GuideRequestsPanel
          isOpen={showRequestsPanel}
          onClose={() => setShowRequestsPanel(false)}
          preferredDestinations={itineraryData?.destinations_used || []}
          showCreateForm={requestsPanelShowCreateForm}
          initialFormData={requestsPanelInitialFormData}
        />
      </div>
    );
  }

  // Onboarding form
  if (view === 'onboarding') {
    return (
      <div className={theme === 'dark' ? 'min-h-screen bg-gray-950 flex flex-col' : 'min-h-screen bg-slate-50 flex flex-col'}>
        <Navbar {...navProps} />
        <OnboardingForm onSubmit={handleFormSubmit} loading={loading} aiRateLimited={aiRateLimited} theme={theme} />

        {/* Auth Modal & Guide Requests available on onboarding view */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authInitialMode}
        />
        <GuideRequestsPanel
          isOpen={showRequestsPanel}
          onClose={() => setShowRequestsPanel(false)}
          preferredDestinations={itineraryData?.destinations_used || []}
          showCreateForm={requestsPanelShowCreateForm}
          initialFormData={requestsPanelInitialFormData}
        />
      </div>
    );
  }

  // Loading state
  if (view === 'dashboard' && loading) {
    return (
      <div className={theme === 'dark' ? 'min-h-screen bg-gray-950 flex flex-col' : 'min-h-screen bg-slate-50 flex flex-col'}>
        <Navbar {...navProps} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4" />
            <p className="text-gray-400 font-medium">AI is generating your personalized Nepal itinerary...</p>
            <p className="text-gray-600 text-sm mt-1">GPT-5.4 + Random Forest working together</p>
          </div>
        </div>

        {/* Auth Modal & Guide Requests available while loading dashboard */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authInitialMode}
        />
        <GuideRequestsPanel
          isOpen={showRequestsPanel}
          onClose={() => setShowRequestsPanel(false)}
          preferredDestinations={itineraryData?.destinations_used || []}
          showCreateForm={requestsPanelShowCreateForm}
          initialFormData={requestsPanelInitialFormData}
        />
      </div>
    );
  }

  // Dashboard
  return (
    <div className={theme === 'dark' ? 'h-screen flex flex-col bg-gray-950 overflow-hidden' : 'h-screen flex flex-col bg-slate-50 overflow-hidden'}>
      <Navbar {...navProps} />
      <div className="flex flex-1 overflow-hidden">
        {/* Map — left 60% - fixed, no scroll */}
        <div className="w-[60%] h-full border-r border-white/5 overflow-hidden">
          <NepalMap
            onHeritageClick={handleHeritageClick}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            heritageSiteIds={HERITAGE_SITE_IDS}
          />
        </div>

        {/* Right panel — 40% - scrollable independently */}
        <div className="w-[40%] h-full overflow-y-auto">
          {showHeritage && heritageSite ? (
            <HeritagePanel site={heritageSite} onClose={handleCloseHeritage} theme={theme} />
          ) : itineraryData ? (
            <ItineraryPanel
              itinerary={itineraryData?.itinerary || []}
              totalCost={itineraryData?.total_cost_usd}
              confidence={itineraryData?.confidence_score}
              destinations={itineraryData?.destinations_used}
              highlights={itineraryData?.highlights}
              aiSummary={itineraryData?.ai_summary}
              aiTips={itineraryData?.ai_tips}
              aiEnhanced={itineraryData?.ai_enhanced}
              onRegenerate={handleRegenerate}
              loading={loading}
              aiRateLimited={aiRateLimited}
              onConnectGuide={openRequestsCreateFromDay}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-purple-500/10 p-4 rounded-2xl mb-5 border border-purple-500/20">
                <MapPin className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Explore Nepal's Crowd Map</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
                Click on any destination marker to see crowd levels and trends. Heritage sites open detailed cultural stories.
              </p>
              <button
                onClick={() => setView('onboarding')}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Plan a Personalized Trip
              </button>
              <p className="text-gray-600 text-xs mt-3">Get AI-powered itineraries tailored to you</p>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authInitialMode}
      />

      {/* Guide Requests Panel */}
      <GuideRequestsPanel
        isOpen={showRequestsPanel}
        onClose={() => setShowRequestsPanel(false)}
        preferredDestinations={itineraryData?.destinations_used || []}
        showCreateForm={requestsPanelShowCreateForm}
        initialFormData={requestsPanelInitialFormData}
      />
    </div>
  );
}

export default App;

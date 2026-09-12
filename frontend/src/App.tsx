import React, { useState, useEffect } from 'react';
import { UrbanicNavbar } from './components/layout/UrbanicNavbar';
import { ScrollProgress } from './components/layout/ScrollProgress';
import { HeroSection } from './components/solepulse/HeroSection';
import { WelcomeSection } from './components/solepulse/WelcomeSection';
import { CompanyDetails } from './components/solepulse/CompanyDetails';
import { LiveFleetSection } from './components/solepulse/LiveFleetSection';
import { WindmillLoader } from './components/common/WindmillLoader';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { api } from './services/api';
import { Phone, Mail, ArrowUp, LogOut } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(4);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [navInfo, setNavInfo] = useState<{ msg: string; sub: string }>({
    msg: 'Loading Sole Pulse Command Portal...',
    sub: 'Streaming solar & wind telemetry overview'
  });

  // Auth state – check localStorage on mount
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!api.getToken());
  const [authView, setAuthView] = useState<'login' | 'register'>('login');


  useEffect(() => {
    api.getAlerts().then(alerts => {
      setActiveAlertsCount(alerts.filter(a => a.status === 'ACTIVE').length);
    }).catch(console.error);

    const checkScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const navMeta: Record<string, { msg: string; sub: string }> = {
    home: {
      msg: 'Loading Sole Pulse Command Portal...',
      sub: 'Streaming solar & wind asset telemetry overview'
    },
    dashboard: {
      msg: 'Initializing Live Fleet Operations Center...',
      sub: 'Synchronizing 100 renewable assets across 7 sectors'
    },
    about: {
      msg: 'Loading Sole Pulse Corporate & Engineering Profile...',
      sub: 'Retrieving clean energy deployment history and operations map'
    },
    solutions: {
      msg: 'Loading Predictive Intelligence Architecture...',
      sub: 'Evaluating deep neural autoencoder diagnostic workflows'
    },
    contact: {
      msg: 'Connecting to Dispatch Operations Desk...',
      sub: 'Establishing secure communication with control desk'
    },
  };

  const handleNavigate = (view: string) => {
    const info = navMeta[view] || { msg: `Switching to ${view.toUpperCase()}...`, sub: 'Synchronizing telemetry' };
    setNavInfo(info);
    setIsNavigating(true);

    setTimeout(() => {
      setCurrentView(view);
      setIsNavigating(false);
      if (view === 'dashboard' && currentView === 'home') {
        const el = document.getElementById('fleet-dashboard');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 650);
  };

  const scrollToFleet = () => {
    const el = document.getElementById('fleet-dashboard');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      handleNavigate('dashboard');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setIsLoggedIn(false);
    setAuthView('login');
  };

  // ── Auth gate ────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    if (authView === 'register') {
      return <Register onGoLogin={() => setAuthView('login')} />;
    }
    return (
      <Login
        onLoginSuccess={() => setIsLoggedIn(true)}
        onGoRegister={() => setAuthView('register')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans selection:bg-urbanic-orange/20 selection:text-urbanic-orange">
      {/* TOP AUTH BAR – shows logged-in user indicator + logout */}
      <div className="bg-urbanic-dark border-b border-slate-800 px-6 py-1.5 flex items-center justify-end gap-3">
        <span className="text-industrial-400 text-[11px] font-mono uppercase tracking-widest">
          Operator Session Active
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-industrial-400 hover:text-urbanic-orange transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>

      {/* 
        ANIMATED SCROLLBAR PROGRESS INDICATOR:
        Vertical bar on right screen edge flowing from TOP to BOTTOM as user scrolls
      */}
      <ScrollProgress />

      {/* 
        URBANIC HEADER & TOP CONTACT BAR:
        Contains phone 010-020-0340, email, logo, and active orange menu buttons (AI Benchmark removed)
      */}
      <UrbanicNavbar
        currentView={currentView}
        onNavigate={handleNavigate}
        activeAlertsCount={activeAlertsCount}
      />


      {/* MAIN VIEW CONTENT */}
      <main className="flex-1 min-h-[60vh]">
        {isNavigating ? (
          <div className="py-24 max-w-7xl mx-auto px-6">
            <WindmillLoader
              message={navInfo.msg}
              subMessage={navInfo.sub}
            />
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <>
                {/* 
                  HERO CAROUSEL:
                  Uses the Pixabay Wind Turbine Windmill Sunset animated GIF in place of the static image,
                  with bold uppercase typography and orange action buttons!
                */}
                <HeroSection
                  onExploreDashboard={scrollToFleet}
                  onReadMore={() => handleNavigate('about')}
                />

                {/* 
                  WELCOME TO SOLE PULSE & 3 FEATURE COLUMNS:
                  Matches the exact card layout from the uploaded template
                */}
                <WelcomeSection
                  onLearnMoreAI={scrollToFleet}
                  onLearnMoreIoT={scrollToFleet}
                  onLearnMoreYield={scrollToFleet}
                />

                {/* 
                  LIVE PREDICTIVE MAINTENANCE FLEET DASHBOARD:
                  Clean Urbanic light operational center with 7 KPI metrics, asset directory, diagnostics, and charts
                */}
                <LiveFleetSection />

                {/* 
                  COMPANY INFORMATION ("SOLE PULSE"):
                  Story, mission, statistics, operations hub, and phone/email dispatch
                */}
                <CompanyDetails />
              </>
            )}

            {currentView === 'about' && (
              <div className="py-4">
                <CompanyDetails />
              </div>
            )}

            {currentView === 'solutions' && (
              <div className="py-4 space-y-6">
                <WelcomeSection
                  onLearnMoreAI={scrollToFleet}
                  onLearnMoreIoT={scrollToFleet}
                  onLearnMoreYield={scrollToFleet}
                />
                <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-16">
                  <LiveFleetSection />
                </div>
              </div>
            )}

            {currentView === 'dashboard' && (
              <div className="bg-slate-50 min-h-screen">
                <LiveFleetSection />
              </div>
            )}

            {currentView === 'contact' && (
              <div className="py-4">
                <CompanyDetails />
              </div>
            )}
          </>
        )}
      </main>

      {/* BACK TO TOP BUTTON */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 p-3 bg-urbanic-orange text-white rounded-none border border-white/20 shadow-lg hover:bg-urbanic-orangeHover transition-all hover:scale-105"
          aria-label="Back to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* CLEAN URBANIC FOOTER (Team and architecture sections removed per request) */}
      <footer className="bg-urbanic-dark text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white uppercase">Sole</span>
              <span className="text-xl font-light text-urbanic-orange uppercase">Pulse</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Sole Pulse is an AI-powered predictive maintenance platform for commercial solar arrays and utility wind farms.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Platform Navigation</h4>
            <ul className="space-y-1.5 font-medium">
              <li><button onClick={() => handleNavigate('home')} className="hover:text-urbanic-orange transition-colors">Home Portal</button></li>
              <li><button onClick={() => handleNavigate('dashboard')} className="hover:text-urbanic-orange transition-colors">Live Fleet Dashboard</button></li>
              <li><button onClick={() => handleNavigate('about')} className="hover:text-urbanic-orange transition-colors">About Sole Pulse</button></li>
              <li><button onClick={() => handleNavigate('contact')} className="hover:text-urbanic-orange transition-colors">Contact Operations Desk</button></li>
            </ul>
          </div>

          {/* Col 3: Contact info from template */}
          <div className="space-y-2">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Dispatch Operations</h4>
            <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
              <Phone className="w-3.5 h-3.5 text-urbanic-orange" />
              <span>010-020-0340</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-urbanic-orange" />
              <span>contact@solepulse.energy</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Clean Energy Operations Center &bull; Sector 7 Wind & Solar Farm
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800/80 px-6 lg:px-12 py-4 text-center text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
          <span>&copy; 2026 Sole Pulse Energy Systems. All rights reserved.</span>
          <span className="font-mono text-urbanic-orange">Renewable Asset Intelligence</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

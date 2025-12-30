// REBUILD-FORCE-V4: File Renamed to MainApp.tsx
import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import SelectionPage from './components/SelectionPage';
import NewRegistrationForm from './components/NewRegistrationForm';
import MutationForm from './components/MutationForm';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import { UserCogIcon } from './components/icons/UserCogIcon';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationContainer from './components/NotificationContainer';
import GeolocationWrapper from './components/GeolocationWrapper';

type Page = 'landing' | 'selection' | 'newRegistration' | 'mutation' | 'login' | 'dashboard';

const MainApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // --- EFFECT FOR PROTECTED ROUTE ---
  useEffect(() => {
    // If the user tries to access the dashboard but isn't logged in,
    // this effect will run after the render and safely redirect them to the login page.
    if (currentPage === 'dashboard' && !isAdminAuthenticated) {
      setCurrentPage('login');
    }
  }, [currentPage, isAdminAuthenticated]);


  // --- Navigation Handlers ---
  const handleContinueToSelection = () => setCurrentPage('selection');
  const handleGoToNewRegistration = () => setCurrentPage('newRegistration');
  const handleGoToMutation = () => setCurrentPage('mutation');
  const handleBackToLanding = () => setCurrentPage('landing');
  const handleBackToSelection = () => setCurrentPage('selection');
  const handleGoToLogin = () => setCurrentPage('login');
  
  // --- Auth Handlers ---
  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setCurrentPage('dashboard');
  };
  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentPage('landing');
  };

  // --- Page Rendering Logic (Refactored to break build cache) ---
  const pageComponents: Record<Page, React.ReactNode> = {
    landing: <LandingPage onContinue={handleContinueToSelection} />,
    selection: (
      <GeolocationWrapper>
        <SelectionPage 
          onBack={handleBackToLanding} 
          onGoToNewRegistration={handleGoToNewRegistration}
          onGoToMutation={handleGoToMutation}
        />
      </GeolocationWrapper>
    ),
    newRegistration: (
      <GeolocationWrapper>
        <NewRegistrationForm onBack={handleBackToSelection} />
      </GeolocationWrapper>
    ),
    mutation: (
      <GeolocationWrapper>
        <MutationForm onBack={handleBackToSelection} />
      </GeolocationWrapper>
    ),
    login: <LoginPage onLoginSuccess={handleLoginSuccess} onBackToHome={handleBackToLanding} />,
    dashboard: isAdminAuthenticated ? <DashboardPage onLogout={handleLogout} /> : null,
  };

  const showAdminButton = !['login', 'dashboard'].includes(currentPage);

  return (
    <NotificationProvider>
      <div className="min-h-screen relative font-sans text-slate-800 bg-slate-900">
        {/* Background Hero Layer */}
        <div className="absolute inset-0 z-0">
          <img 
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop" 
              alt="Background Gudang Logistik" 
              className="w-full h-full object-cover"
          />
          {/* Dark Overlay untuk keterbacaan - ditingkatkan ke 90% opacity */}
          <div className="absolute inset-0 bg-slate-950/75"></div>
        </div>

        {/* NOTIFICATION CONTAINER */}
        <NotificationContainer />

        {/* Main Content Layer */}
        <div className="relative z-10 flex flex-col min-h-screen">
            <header className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-20 transition-all">
              <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={handleBackToLanding}>
                  <img 
                      src="https://i.imgur.com/fF8ZWc7.png" 
                      alt="Logo Nexus" 
                      className="h-10 w-auto mix-blend-multiply" 
                  />
                  <h1 className="text-2xl font-bold text-orange-600">
                      PENDAFTARAN <span className="text-slate-800">DW NEXUS</span>
                  </h1>
                </div>
                {showAdminButton && (
                  <button
                      onClick={handleGoToLogin}
                      className="flex items-center space-x-2 text-slate-600 hover:text-orange-600 transition-colors"
                      title="Mode Admin"
                    >
                      <UserCogIcon className="w-6 h-6" />
                      <span className="hidden sm:inline font-semibold">Mode Admin</span>
                  </button>
                )}
              </div>
            </header>
            
            <main className="container mx-auto px-4 py-8 flex-grow">
              {pageComponents[currentPage] || pageComponents.landing}
            </main>
            
            <footer className="text-center py-6 text-slate-400 text-sm">
              <p>&copy; {new Date().getFullYear()} DW Nexus. All rights reserved.</p>
            </footer>
        </div>
      </div>
    </NotificationProvider>
  );
};

export default MainApp;
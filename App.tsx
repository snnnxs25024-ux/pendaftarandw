import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import SelectionPage from './components/SelectionPage';
import NewRegistrationForm from './components/NewRegistrationForm';
import MutationForm from './components/MutationForm';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import { UserCogIcon } from './components/icons/UserCogIcon';

type Page = 'landing' | 'selection' | 'newRegistration' | 'mutation' | 'login' | 'dashboard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const handleContinueToSelection = () => setCurrentPage('selection');
  const handleGoToNewRegistration = () => setCurrentPage('newRegistration');
  const handleGoToMutation = () => setCurrentPage('mutation');
  const handleBackToLanding = () => setCurrentPage('landing');
  const handleBackToSelection = () => setCurrentPage('selection');
  const handleGoToLogin = () => setCurrentPage('login');
  
  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentPage('landing');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onContinue={handleContinueToSelection} />;
      case 'selection':
        return (
            <SelectionPage 
                onBack={handleBackToLanding} 
                onGoToNewRegistration={handleGoToNewRegistration}
                onGoToMutation={handleGoToMutation}
            />
        );
      case 'newRegistration':
        return <NewRegistrationForm onBack={handleBackToSelection} />;
      case 'mutation':
        return <MutationForm onBack={handleBackToSelection} />;
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} onBackToHome={handleBackToLanding} />;
      case 'dashboard':
        if (isAdminAuthenticated) {
            return <DashboardPage onLogout={handleLogout} />;
        }
        // If not authenticated, redirect to login
        setCurrentPage('login');
        return <LoginPage onLoginSuccess={handleLoginSuccess} onBackToHome={handleBackToLanding} />;
      default:
        return <LandingPage onContinue={handleContinueToSelection} />;
    }
  }

  const showAdminButton = !['login', 'dashboard'].includes(currentPage);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md sticky top-0 z-10">
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
      <main className="container mx-auto px-4 py-8">
        {renderPage()}
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} DW Nexus. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;

import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext';
import { DocumentProvider } from './context/DocumentContext';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import JobSearchPage from './pages/JobSearchPage';
import DocumentsPage from './pages/DocumentsPage';
import Header from './components/Header';
import AuthPage from './pages/AuthPage';
import CandidatesPage from './pages/CandidatesPage';
import MessagesPage from './pages/MessagesPage';


const AppContent: React.FC = () => {
  const location = useLocation();
  const showHeader = !['/', '/auth'].includes(location.pathname);

  return (
    <>
      {showHeader && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
          <Route path="/jobs" element={<JobSearchPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
        </Routes>
      </main>
    </>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <ProfileProvider>
        <DocumentProvider>
          <AppContent />
        </DocumentProvider>
      </ProfileProvider>
    </HashRouter>
  );
};

export default App;
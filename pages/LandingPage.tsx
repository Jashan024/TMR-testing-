
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { ArrowRightIcon } from '../components/Icons';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden bg-brand-dark">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <header className="absolute top-0 left-0 w-full p-8 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-3xl font-bold tracking-tighter text-white">
            TMR<span className="text-cyan-400">.</span>
          </Link>
          <div className="hidden sm:flex items-center space-x-8 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">How it works</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
            <Button to="/auth" variant="outline" className="px-5 py-2 text-sm bg-white/5 border-white/10 hover:bg-white/10">Sign In</Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto z-10 animate-fade-in-up px-4">
        <div className="mb-6 inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          Next-Gen Recruitment
        </div>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white leading-[1.1] mb-8">
          Your Career, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">Under Your Control.</span>
        </h1>
        <p className="mt-6 text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
          The elite platform connecting top-tier talent directly with recruiters.
          No middleman, no noise, just your next big move.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button to="/auth?role=candidate" variant="primary" className="px-10 py-5 text-xl w-full sm:w-auto">
            Find Opportunities
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </Button>
          <Button to="/auth?role=recruiter" variant="secondary" className="px-10 py-5 text-xl w-full sm:w-auto">
            Hire Top Talent
          </Button>
        </div>
      </main>

      <footer className="absolute bottom-10 w-full text-center text-gray-500 text-sm tracking-widest uppercase font-medium">
        <p>&copy; {new Date().getFullYear()} ThatsMyRecruiter.com</p>
      </footer>
    </div>
  );
};

export default LandingPage;
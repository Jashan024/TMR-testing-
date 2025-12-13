
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { ArrowRightIcon } from '../components/Icons';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      <header className="absolute top-0 left-0 w-full p-6 sm:p-8 z-20">
        <div className="container mx-auto flex justify-start">
            <Link to="/" className="text-2xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                TMR
            </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto z-10 animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-300 to-blue-500 leading-tight">
          Your Next Opportunity Awaits.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
          Whether you're a candidate ready for a new challenge or a recruiter searching for top talent, our platform connects you directly. No noise, just results.
        </p>
        <div className="mt-10">
          <Button to="/auth" variant="primary" className="px-8 py-4 text-lg">
            Get Started
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </main>
      <footer className="absolute bottom-8 text-gray-400 z-10">
        <p>&copy; {new Date().getFullYear()} ThatsMyRecruiter.com. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
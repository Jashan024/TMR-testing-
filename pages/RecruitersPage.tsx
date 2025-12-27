import React, { useState } from 'react';
import Button from '../components/Button';
import { ArrowRightIcon } from '../components/Icons';
import { Link, useNavigate } from 'react-router-dom';

const RecruitersPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/recruiters/thank-you');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      <header className="absolute top-0 left-0 w-full p-6 sm:p-8 z-20">
        <div className="container mx-auto flex justify-start">
          <Link to="/" className="text-2xl font-bold tracking-wider text-zinc-900">
            TMR<span className="text-emerald-500">.</span>
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto z-10 animate-fade-in-up">
        <div className="mb-4 inline-block">
          <span className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-emerald-100 uppercase tracking-wider">
            Coming Soon
          </span>
        </div>
        <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-zinc-900 leading-[1.1]">
          The best talent, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-700">on their terms.</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto font-light leading-relaxed">
          Access a curated pool of candidates who are in control of their search. No noise, just high-intent professionals ready for their next role.
        </p>
        <form onSubmit={handleSubmit} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full px-5 py-3 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 shadow-sm"
          />
          <Button type="submit" variant="primary" className="w-full sm:w-auto flex-shrink-0">
            Get Notified <ArrowRightIcon className="w-5 h-5 ml-2" />
          </Button>
        </form>
      </main>
      <footer className="absolute bottom-8 text-zinc-400 z-10">
        <p>Are you a candidate? <Link to="/" className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline">Start here</Link>.</p>
      </footer>
    </div>
  );
};

export default RecruitersPage;
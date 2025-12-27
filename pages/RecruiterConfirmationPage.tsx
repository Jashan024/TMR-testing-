import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { CheckCircleIcon } from '../components/Icons';

const RecruiterConfirmationPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      <header className="absolute top-0 left-0 w-full p-6 sm:p-8 z-20">
        <div className="container mx-auto flex justify-start">
          <Link to="/" className="text-2xl font-bold tracking-wider text-zinc-900">
            TMR<span className="text-emerald-500">.</span>
          </Link>
        </div>
      </header>
      <main className="max-w-md mx-auto z-10 animate-fade-in-up">
        <Card className="p-8 sm:p-10">
          <div className="flex justify-center mb-6">
            <CheckCircleIcon className="w-20 h-20 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">
            You're on the list!
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Thank you for your interest. We'll send you an email as soon as the recruiter portal is ready.
          </p>
          <div className="mt-8">
            <Button to="/" variant="primary">
              Back to Home
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default RecruiterConfirmationPage;

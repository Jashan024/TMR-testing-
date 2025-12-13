
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { Input } from '../components/Input';
import { EnvelopeIcon, LockClosedIcon, UserIcon, BriefcaseIcon } from '../components/Icons';
import { supabase } from '../lib/supabaseClient';
import { useProfile } from '../context/ProfileContext';

type AuthView = 'signin' | 'signup' | 'forgot_password';

const AuthPage: React.FC = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    
    const initialRole = queryParams.get('role');
    const [role, setRole] = useState<'candidate' | 'recruiter' | null>(
        initialRole === 'candidate' || initialRole === 'recruiter' ? initialRole : null
    );

    const initialView = (queryParams.get('view') as AuthView) || 'signup';

    const [view, setView] = useState<AuthView>(initialView);

    // Force signin view for recruiters (signup disabled)
    useEffect(() => {
        if (role === 'recruiter' && view === 'signup') {
            setView('signin');
        }
    }, [role, view]);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { session, isProfileCreated, profile, loading: profileLoading } = useProfile();
    const userId = session?.user?.id;

    // This combined loading state handles both the form submission and the subsequent profile loading.
    const isLoading = formLoading || profileLoading;

    // If a user is already logged in, redirect them away from the auth page
    // once we know their profile status.
    useEffect(() => {
        // Wait until the profile loading is complete before redirecting.
        if (userId && !profileLoading) {
            const redirectUrl = sessionStorage.getItem('redirectUrl');
            if (redirectUrl) {
                sessionStorage.removeItem('redirectUrl');
                // Use window.location.href because react-router's navigate doesn't always
                // work well with hash routing after a full page auth flow.
                window.location.href = redirectUrl;
                return;
            }
            
            if (profile?.role === 'recruiter') {
                navigate('/candidates');
            } else {
                navigate(isProfileCreated ? '/profile/me' : '/onboarding');
            }
        }
    }, [userId, isProfileCreated, profile, profileLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!supabase) {
            setError("Authentication is unavailable: App is not connected to a backend service.");
            return;
        }

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        
        setError('');
        setMessage('');

        // Add manual validation before setting loading state
        if (view === 'signup' && (!name.trim() || !email.trim() || !password)) {
            setError('Please fill in all fields to sign up.');
            return;
        }
        if (view === 'signin' && (!email.trim() || !password)) {
            setError('Please enter your email and password to sign in.');
            return;
        }
        if (view === 'forgot_password' && !email.trim()) {
            setError('Please enter your email address to reset your password.');
            return;
        }
        
        setFormLoading(true);
        
        try {
            if (view === 'signup') {
                // Prevent signup for recruiters
                if (role === 'recruiter') {
                    setError('Sign up is not available for recruiters. Please sign in instead.');
                    setFormLoading(false);
                    setView('signin');
                    return;
                }
                
                const { data, error } = await supabase.auth.signUp({ 
                    email, 
                    password, 
                    options: { 
                        data: { 
                            full_name: name,
                            role: role,
                        } 
                    } 
                });

                if (error) throw error;
                
                // On successful sign-up, the onAuthStateChange listener will handle setting the session
                // and the useEffect hook above will trigger the redirect.
                // We only need to show a message if email confirmation is required.
                if (data.user && !data.session) {
                    setMessage('Check your email for a confirmation link to complete your registration.');
                }
            } else if (view === 'signin') {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                
                if (!data.session) {
                    throw new Error('Sign in failed, please try again.');
                }
                // On successful sign-in, the onAuthStateChange listener will fire, which updates the
                // `session` state. The useEffect hook at the top of this component will then handle redirection.
                
            } else if (view === 'forgot_password') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    // This path should point to where your app will handle the password update.
                    // For now, it redirects back to the auth page. You might want a dedicated reset page.
                    redirectTo: `${window.location.origin}/#/auth`,
                });
                if (error) throw error;
                setMessage('Check your email for a password reset link.');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setFormLoading(false);
        }
    };

    const tabButtonClasses = (tabName: 'signin' | 'signup') => {
        const isActive = view === tabName;
        return `w-1/2 py-3 text-center font-semibold transition-all duration-300 rounded-t-lg cursor-pointer ${
            isActive 
                ? 'text-white bg-gray-800/80 shadow-inner' 
                : 'text-gray-400 bg-gray-900/50 hover:bg-gray-800/60 hover:text-gray-300'
        }`;
    };

    return (
        <div className="min-h-screen flex flex-col px-4 relative overflow-x-hidden">
            <header className="w-full p-6 sm:p-8 flex-shrink-0">
                <div className="container mx-auto flex justify-start">
                    <Link to="/" className="text-2xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        TMR
                    </Link>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center w-full max-w-md mx-auto animate-fade-in-up py-8">
                {!role ? (
                    <Card className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-center text-white mb-2">Join as a Candidate or Recruiter</h2>
                        <p className="text-gray-400 mb-8">Please select how you'd like to use the platform.</p>
                        <div className="space-y-4">
                            <button 
                                onClick={() => setRole('candidate')}
                                className="w-full text-left p-6 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <div className="flex items-center">
                                    <UserIcon className="w-8 h-8 text-cyan-400 mr-4 flex-shrink-0"/>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">I'm a Candidate</h3>
                                        <p className="text-gray-400">Create a profile and let opportunities find you.</p>
                                    </div>
                                </div>
                            </button>
                            <button 
                                onClick={() => { setRole('recruiter'); setView('signin'); }}
                                className="w-full text-left p-6 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <div className="flex items-center">
                                    <BriefcaseIcon className="w-8 h-8 text-cyan-400 mr-4 flex-shrink-0"/>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">I'm a Recruiter</h3>
                                        <p className="text-gray-400">Find and connect with top-tier talent.</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </Card>
                ) : (
                    <Card className="p-0 overflow-hidden">
                        {view !== 'forgot_password' && (
                            <div className={`flex ${role === 'recruiter' ? 'justify-center' : ''}`}>
                                {role !== 'recruiter' && (
                                    <button 
                                        type="button"
                                        onClick={(e) => { 
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setView('signup'); 
                                            setError(''); 
                                            setMessage(''); 
                                        }} 
                                        className={tabButtonClasses('signup')}
                                        aria-pressed={view === 'signup'}
                                    >
                                        Sign Up
                                    </button>
                                )}
                                <button 
                                    type="button"
                                    onClick={(e) => { 
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setView('signin'); 
                                        setError(''); 
                                        setMessage(''); 
                                    }} 
                                    className={role === 'recruiter' ? tabButtonClasses('signin').replace('w-1/2', 'w-48') : tabButtonClasses('signin')}
                                    aria-pressed={view === 'signin'}
                                >
                                    Sign In
                                </button>
                            </div>
                        )}

                        <div className="p-8">
                            <div className="text-left mb-4">
                                <button type="button" onClick={() => setRole(null)} className="text-sm text-cyan-400 hover:underline">&larr; Change role</button>
                            </div>

                            {error && <p className="mb-4 text-center text-red-400">{error}</p>}
                            {message && <p className="mb-4 text-center text-green-400">{message}</p>}

                            {view === 'signup' && role !== 'recruiter' && (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <h2 className="text-2xl font-bold text-center text-white">
                                        Create Your Account
                                    </h2>
                                    <Input label="Full Name" name="name" type="text" placeholder="Alex Doe" required icon={<UserIcon />} disabled={isLoading} />
                                    <Input label="Email Address" name="email" type="email" placeholder="you@example.com" required icon={<EnvelopeIcon />} disabled={isLoading} />
                                    <Input label="Password" name="password" type="password" placeholder="••••••••" required icon={<LockClosedIcon />} disabled={isLoading} />
                                    <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
                                        {isLoading ? 'Verifying...' : 'Create Account'}
                                    </Button>
                                </form>
                            )}
                            
                            {view === 'signin' && (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <h2 className="text-2xl font-bold text-center text-white">Welcome Back</h2>
                                    {role === 'recruiter' && (
                                        <p className="text-center text-sm text-gray-400 mb-2">Recruiter accounts are invitation-only. Please sign in with your existing credentials.</p>
                                    )}
                                    <Input label="Email Address" name="email" type="email" placeholder="you@example.com" required icon={<EnvelopeIcon />} disabled={isLoading} />
                                    <Input label="Password" name="password" type="password" placeholder="••••••••" required icon={<LockClosedIcon />} disabled={isLoading} />
                                    <div className="text-right">
                                        <button type="button" onClick={() => setView('forgot_password')} className="text-sm text-cyan-400 hover:underline">Forgot password?</button>
                                    </div>
                                    <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
                                        {isLoading ? 'Signing In...' : 'Sign In'}
                                    </Button>
                                </form>
                            )}

                            {view === 'forgot_password' && (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <h2 className="text-2xl font-bold text-center text-white">Reset Password</h2>
                                    <p className="text-center text-sm text-gray-400">Enter your email and we'll send you a link to reset your password.</p>
                                    <Input label="Email Address" name="email" type="email" placeholder="you@example.com" required icon={<EnvelopeIcon />} disabled={isLoading} />
                                    <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
                                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                                    </Button>
                                    <div className="text-center">
                                        <button type="button" onClick={() => setView('signin')} className="text-sm text-cyan-400 hover:underline">Back to Sign In</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
};

export default AuthPage;
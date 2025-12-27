import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { CloseIcon, MenuIcon } from './Icons';
import { supabase } from '../lib/supabaseClient';

const Avatar: React.FC<{ photo_url: string; name: string; size?: string }> = ({ photo_url, name, size = 'h-9 w-9' }) => {
    return photo_url ? (
        <img src={photo_url} alt={name} className={`${size} rounded-full object-cover`} />
    ) : (
        <div className={`${size} bg-zinc-100 rounded-full flex items-center justify-center text-sm font-bold text-emerald-600 border border-zinc-200`}>
            {name ? name.charAt(0) : '?'}
        </div>
    );
};

const NavItem: React.FC<{ to: string, children: React.ReactNode, isComingSoon?: boolean, baseStyle: string, activeStyle: string, mobileStyle?: string, onClick?: () => void }> = ({ to, children, isComingSoon, baseStyle, activeStyle, mobileStyle, onClick }) => {
    return (
        <NavLink to={to} onClick={onClick} className={({ isActive }) => `${mobileStyle || ''} ${baseStyle} ${isActive ? activeStyle : ''}`}>
            <span className="relative">
                {children}
                {isComingSoon && (
                    <span className="absolute -top-1.5 -right-6 bg-emerald-900/80 text-emerald-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-700">
                        SOON
                    </span>
                )}
            </span>
        </NavLink>
    )
}


const Header: React.FC = () => {
    const { profile, logout } = useProfile();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const location = useLocation();

    const isRecruiter = profile?.role === 'recruiter';
    const isRecruiterViewingProfile = isRecruiter && location.pathname.startsWith('/profile/');
    const isViewingPublicProfile = location.pathname.startsWith('/profile/') && location.pathname !== '/profile/me';
    const isLoggedIn = !!profile;

    const handleLogout = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();

        if (isLoggingOut) {
            return; // Prevent multiple clicks
        }

        setIsLoggingOut(true);
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const baseLinkStyle = "relative text-zinc-600 hover:text-zinc-900 transition-all duration-300 py-1.5 px-3 rounded-xl hover:bg-zinc-100 font-medium text-sm tracking-wide";
    const activeLinkStyle = "text-zinc-900 bg-zinc-100 ring-1 ring-zinc-200/50 shadow-sm";
    const mobileLinkStyle = "block py-3 px-4 text-base rounded-2xl";

    const candidateNav = (
        <>
            <NavItem to="/jobs" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle}>Find Jobs</NavItem>
            <NavItem to="/documents" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle}>Documents</NavItem>
            <NavItem to="/messages" isComingSoon baseStyle={baseLinkStyle} activeStyle={activeLinkStyle}>Messages</NavItem>
            <NavItem to="/profile/me" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle}>My Portfolio</NavItem>
        </>
    );

    const recruiterNav = (
        <>
            <NavItem to="/candidates" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle}>Candidates</NavItem>
            <NavItem to="/messages" isComingSoon baseStyle={baseLinkStyle} activeStyle={activeLinkStyle}>Messages</NavItem>
        </>
    );

    const mobileCandidateNav = (
        <>
            <NavItem to="/jobs" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle} mobileStyle={mobileLinkStyle} onClick={() => setIsMenuOpen(false)}>Find Jobs</NavItem>
            <NavItem to="/documents" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle} mobileStyle={mobileLinkStyle} onClick={() => setIsMenuOpen(false)}>Documents</NavItem>
            <NavItem to="/messages" isComingSoon baseStyle={baseLinkStyle} activeStyle={activeLinkStyle} mobileStyle={mobileLinkStyle} onClick={() => setIsMenuOpen(false)}>Messages</NavItem>
            <NavItem to="/profile/me" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle} mobileStyle={mobileLinkStyle} onClick={() => setIsMenuOpen(false)}>My Portfolio</NavItem>
        </>
    );

    const mobileRecruiterNav = (
        <>
            <NavItem to="/candidates" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle} mobileStyle={mobileLinkStyle} onClick={() => setIsMenuOpen(false)}>Candidates</NavItem>
            <NavItem to="/messages" isComingSoon baseStyle={baseLinkStyle} activeStyle={activeLinkStyle} mobileStyle={mobileLinkStyle} onClick={() => setIsMenuOpen(false)}>Messages</NavItem>
        </>
    );

    return (
        <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-zinc-200/50">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <NavLink to={isRecruiter ? "/candidates" : (profile ? "/profile/me" : "/")} className="text-2xl font-bold text-zinc-900 tracking-tighter">
                    TMR<span className="text-emerald-500">.</span>
                </NavLink>

                <nav className="hidden md:flex items-center space-x-8">
                    {isViewingPublicProfile ? null : (isRecruiter ? recruiterNav : candidateNav)}
                </nav>

                <div className="flex items-center space-x-4">
                    {profile && !isViewingPublicProfile && (
                        <div className="hidden md:flex items-center space-x-4">
                            {isRecruiter ? (
                                <>
                                    {isRecruiterViewingProfile && (
                                        <NavLink to="/candidates" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                                            &larr; Back to Candidates
                                        </NavLink>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoggingOut ? 'Logging out...' : 'Log Out'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Avatar photo_url={profile.photo_url} name={profile.name} />
                                    <span className="font-medium text-zinc-900">{profile.name}</span>
                                    <span className="text-zinc-200">|</span>
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoggingOut ? 'Logging out...' : 'Log Out'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                    {!isViewingPublicProfile && (
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label="Toggle menu"
                                className="text-zinc-400 hover:text-zinc-900 focus:outline-none"
                                aria-expanded={isMenuOpen}
                            >
                                {isMenuOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 border-t border-zinc-100 bg-white/95' : 'max-h-0'}`}>
                <nav className="px-6 pb-4 pt-2 flex flex-col space-y-1">
                    {isViewingPublicProfile ? null : (isRecruiter ? mobileRecruiterNav : mobileCandidateNav)}

                    {profile && !isViewingPublicProfile && (
                        <div className="pt-4 mt-2 border-t border-zinc-100">
                            {isRecruiter ? (
                                <>
                                    {isRecruiterViewingProfile && (
                                        <NavLink
                                            to="/candidates"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block py-2 px-3 text-base text-emerald-600 rounded-md bg-emerald-50 hover:bg-emerald-100 transition-colors mb-2"
                                        >
                                            &larr; Back to Candidates
                                        </NavLink>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            setIsMenuOpen(false);
                                            handleLogout(e);
                                        }}
                                        disabled={isLoggingOut}
                                        className="w-full text-left block py-2 px-3 text-base text-zinc-600 rounded-md bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoggingOut ? 'Logging out...' : 'Log Out'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center space-x-3 mb-4 px-1">
                                        <Avatar photo_url={profile.photo_url} name={profile.name} size="h-10 w-10" />
                                        <div>
                                            <p className="font-medium text-zinc-900">{profile.name}</p>
                                            <p className="text-sm text-zinc-500">{profile.title}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            setIsMenuOpen(false);
                                            handleLogout(e);
                                        }}
                                        disabled={isLoggingOut}
                                        className="w-full text-left block py-2 px-3 text-base text-zinc-600 rounded-md bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoggingOut ? 'Logging out...' : 'Log Out'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;

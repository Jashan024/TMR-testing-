import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { CloseIcon, MenuIcon } from './Icons';
import { supabase } from '../lib/supabaseClient';

const Avatar: React.FC<{ photo_url: string; name: string; size?: string }> = ({ photo_url, name, size = 'h-9 w-9' }) => {
    return photo_url ? (
      <img src={photo_url} alt={name} className={`${size} rounded-full object-cover`} />
    ) : (
      <div className={`${size} bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-cyan-400`}>
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
                    <span className="absolute -top-1.5 -right-6 bg-cyan-900/80 text-cyan-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-cyan-700">
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
    
    const baseLinkStyle = "relative text-gray-300 hover:text-white transition-colors duration-200 py-2";
    const activeLinkStyle = "text-white font-semibold after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] after:bg-cyan-400 after:shadow-[0_0_8px_theme(colors.cyan.400)]";
    const mobileLinkStyle = "block py-2 text-base";

    const candidateNav = (
        <>
            <NavItem to="/jobs" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle}>Find Jobs</NavItem>
            <NavItem to="/documents" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle}>Documents</NavItem>
            <NavItem to="/messages" isComingSoon baseStyle={baseLinkStyle} activeStyle={activeLinkStyle}>Messages</NavItem>
            <NavItem to="/profile/me" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle}>Public Profile</NavItem>
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
            <NavItem to="/profile/me" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle} mobileStyle={mobileLinkStyle} onClick={() => setIsMenuOpen(false)}>Public Profile</NavItem>
        </>
    );

    const mobileRecruiterNav = (
        <>
            <NavItem to="/candidates" baseStyle={baseLinkStyle} activeStyle={activeLinkStyle} mobileStyle={mobileLinkStyle} onClick={() => setIsMenuOpen(false)}>Candidates</NavItem>
            <NavItem to="/messages" isComingSoon baseStyle={baseLinkStyle} activeStyle={activeLinkStyle} mobileStyle={mobileLinkStyle} onClick={() => setIsMenuOpen(false)}>Messages</NavItem>
        </>
    );

    return (
        <header className="bg-gray-900/70 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-800">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <NavLink to={isRecruiter ? "/candidates" : (profile ? "/profile/me" : "/")} className="text-xl font-bold text-white tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    TMR
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
                                        <NavLink to="/candidates" className="text-sm font-medium text-cyan-400 hover:text-white transition-colors">
                                            &larr; Back to Candidates
                                        </NavLink>
                                    )}
                                    <button 
                                        onClick={handleLogout} 
                                        disabled={isLoggingOut}
                                        className="text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoggingOut ? 'Logging out...' : 'Log Out'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Avatar photo_url={profile.photo_url} name={profile.name} />
                                    <span className="font-medium text-gray-200">{profile.name}</span>
                                    <span className="text-gray-600">|</span>
                                    <button 
                                        onClick={handleLogout} 
                                        disabled={isLoggingOut}
                                        className="text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="text-gray-300 hover:text-white focus:outline-none"
                                aria-expanded={isMenuOpen}
                            >
                                {isMenuOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 border-t border-gray-800' : 'max-h-0'}`}>
                <nav className="px-6 pb-4 pt-2 flex flex-col space-y-1">
                    {isViewingPublicProfile ? null : (isRecruiter ? mobileRecruiterNav : mobileCandidateNav)}
                    
                    {profile && !isViewingPublicProfile && (
                        <div className="pt-4 mt-2 border-t border-gray-700">
                            {isRecruiter ? (
                                <>
                                    {isRecruiterViewingProfile && (
                                        <NavLink
                                            to="/candidates"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block py-2 px-3 text-base text-cyan-400 rounded-md bg-gray-800/50 hover:bg-gray-700/80 hover:text-white transition-colors mb-2"
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
                                        className="w-full text-left block py-2 px-3 text-base text-gray-300 rounded-md bg-gray-800/50 hover:bg-gray-700/80 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoggingOut ? 'Logging out...' : 'Log Out'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center space-x-3 mb-4 px-1">
                                        <Avatar photo_url={profile.photo_url} name={profile.name} size="h-10 w-10" />
                                        <div>
                                            <p className="font-medium text-white">{profile.name}</p>
                                            <p className="text-sm text-gray-400">{profile.title}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { 
                                            setIsMenuOpen(false); 
                                            handleLogout(e); 
                                        }}
                                        disabled={isLoggingOut}
                                        className="w-full text-left block py-2 px-3 text-base text-gray-300 rounded-md bg-gray-800/50 hover:bg-gray-700/80 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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


import React, { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface ProfileContextType {
  session: Session | null;
  profile: UserProfile | null;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<UserProfile>;
  logout: () => Promise<void>;
  isProfileCreated: boolean;
  loading: boolean;
  error: string | null;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// This mock data is a fallback for when Supabase isn't configured.
const fallbackProfile: UserProfile = {
    id: 'fallback-user',
    photo_url: '',
    name: "Alex Doe",
    title: "Senior Frontend Engineer",
    industry: 'IT',
    experience: '8',
    roles: ["Frontend Developer", "Full-Stack Developer", "UI/UX Designer"],
    location: "Remote, USA",
    skills: ["React", "TypeScript", "Node.js", "Figma", "Tailwind CSS", "UI/UX Design", "Next.js"],
    bio: "Passionate Senior Frontend Engineer with over 8 years of experience building beautiful, responsive, and user-centric web applications. My goal is to create interfaces that are not only functional but also a delight to use.",
    certifications: ["AWS Certified Developer"],
    portfolio_url: 'https://example.com',
    // FIX: Added missing 'role' property to satisfy the UserProfile type.
    role: 'candidate',
};

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  
  // Session storage for cache that clears when tab is closed
  const PROFILE_STORAGE_KEY = 'tmr_profile_cache_v1';
  const SESSION_PRIME_DONE = useRef(false);
  
  const isProfileCreated = !!profile?.name; // Check for a key field like name

  useEffect(() => {
    // 1) Attempt fast rehydration from sessionStorage to avoid UI flashes on refresh (clears when tab closes)
    let cachedProfile: UserProfile | null = null;
    try {
        const cached = sessionStorage.getItem(PROFILE_STORAGE_KEY);
        if (cached) {
            cachedProfile = JSON.parse(cached) as UserProfile;
            setProfile(cachedProfile);
            // On refresh with cache, clear loading immediately for instant UI
            setLoading(false);
        }
    } catch (_) { /* ignore cache errors */ }

    // If Supabase is not configured, use fallback data and exit.
    if (!supabase) {
        if (!profile) setProfile(fallbackProfile);
        setLoading(false);
        return;
    }

    // 2) Prime the session immediately on mount (prevents "forgotten user" on hard refresh)
    (async () => {
        try {
            const { data: { session: initialSession } } = await supabase.auth.getSession();
            setSession(initialSession);
            if (initialSession && !SESSION_PRIME_DONE.current) {
                // If we have cached profile and it matches session, we're done
                if (cachedProfile && cachedProfile.id === initialSession.user.id) {
                    console.log('Cache matches session - profile already restored');
                    SESSION_PRIME_DONE.current = true;
                    setLoading(false);
                    return;
                }
                
                // Fetch profile once during initial prime (if no cache or mismatch)
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', initialSession.user.id)
                        .single();
                    if (!error && data) {
                        setProfile(data as UserProfile);
                        try { sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
                        setLoading(false);
                    } else {
                        // Profile not found - clear loading
                        setLoading(false);
                    }
                } catch (_) { 
                    // On error, clear loading - auth listener will handle
                    setLoading(false);
                }
                SESSION_PRIME_DONE.current = true;
            } else if (!initialSession) {
                // No session - do NOT trust cachedProfile (it can be stale if tokens were cleared).
                // Clear cached profile to avoid "looks logged in but backend calls fail" (common on mobile).
                if (cachedProfile) {
                    try { sessionStorage.removeItem(PROFILE_STORAGE_KEY); } catch (_) {}
                    setProfile(null);
                }
                // No session - clear loading
                setLoading(false);
            }
        } catch (_) { 
            // On error, clear loading
            setLoading(false);
        }
    })();

    // Set loading to true initially ONLY if we don't have cached profile
    // If we have cache, loading is already false from above
    if (!cachedProfile) {
    setLoading(true);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);

        if (newSession) {
            // Handle auto-profile creation for new recruiters
            const isNewUser = _event === 'SIGNED_IN' && newSession.user.created_at && (new Date().getTime() - new Date(newSession.user.created_at).getTime()) < 60000;
            const isRecruiter = newSession.user.user_metadata.role === 'recruiter';
            
            if (isNewUser && isRecruiter) {
                try {
                    // Check if a profile already exists to avoid race conditions
                    const { data: existingProfile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('id', newSession.user.id)
                        .single();

                    if (!existingProfile) {
                        const { error: upsertError } = await supabase
                            .from('profiles')
                            .upsert({
                                id: newSession.user.id,
                                name: newSession.user.user_metadata.full_name || 'Recruiter',
                                role: 'recruiter',
                                title: 'Recruiter',
                                industry: '', experience: '0', location: '', bio: '',
                                skills: [], roles: [], certifications: [], portfolio_url: '', photo_url: ''
                            });
                        if (upsertError) throw upsertError;
                    }
                } catch (error) {
                    console.error("Failed to auto-create recruiter profile:", error);
                    setError("Failed to initialize your recruiter account.");
                }
            }
            
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', newSession.user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116: row not found
                    throw error;
                }
                setProfile(data);
                try { sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
            } catch (error) {
                console.error("Error fetching profile:", error);
                setError('Failed to fetch profile.');
                setProfile(null);
                try { sessionStorage.removeItem(PROFILE_STORAGE_KEY); } catch (_) {}
            }
        } else {
            setProfile(null);
            try { sessionStorage.removeItem(PROFILE_STORAGE_KEY); } catch (_) {}
        }
        // Always set loading to false after processing the session change.
        setLoading(false);
    });

    return () => {
        authListener?.subscription.unsubscribe();
    };
  }, []);

  // Safety timeout: Clear loading if stuck after 3 seconds
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('Safety timeout: Clearing stuck loading state');
        setLoading(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);
  
  const updateProfile = useCallback(async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    if (!supabase) {
        console.warn("Supabase not configured. Simulating profile update.");
        return new Promise(resolve => {
          setProfile(prevProfile => {
            const updated = { ...(prevProfile || fallbackProfile), ...profileData } as UserProfile;
            resolve(updated);
            return updated;
          });
        });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // If the profile doesn't exist yet in our state, this is likely an INSERT.
    // We create a base profile to ensure `NOT NULL` constraints are met.
    // This is crucial for the first-time update, e.g., when only a photo is uploaded.
    const baseProfile = profile ? {} : {
        name: '', title: '', industry: '', experience: '0', location: '',
        bio: '', skills: [], roles: [], certifications: [], portfolio_url: '',
        photo_url: '', role: 'candidate'
    };

    const updatePayload = {
        ...baseProfile,
        ...profile,
        ...profileData,
        id: user.id,
    };


    const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(updatePayload);

    if (upsertError) {
        console.error("Error upserting profile:", upsertError);
        throw upsertError;
    }

    // Optimistically update the local state. This makes the UI feel faster.
    const updatedProfile = {
      ...(profile || {}),
      ...updatePayload, // Use updatePayload as it contains the merged data
     } as UserProfile;

    setProfile(updatedProfile);
    try { sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile)); } catch (_) {}
    return updatedProfile;
}, [profile]);

  const logout = useCallback(async () => {
    // Prevent multiple logout calls
    if (isLoggingOut) {
      return;
    }
    
    setIsLoggingOut(true);
    
    try {
      // Clear session storage first
      try { 
        sessionStorage.removeItem(PROFILE_STORAGE_KEY);
        sessionStorage.clear(); // Clear all session data
      } catch (_) {}
      
      // Sign out from Supabase
      if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error.message);
      }
    }
      
      // Clear local state immediately
      setProfile(null);
      setSession(null);
      setError(null);
      
      // Use window.location for reliable navigation with hash router
      // This ensures the navigation always works
      window.location.href = '/#/auth';
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, try to navigate
      try {
        window.location.href = '/#/auth';
      } catch (_) {
    navigate('/auth');
      }
    } finally {
      setIsLoggingOut(false);
    }
  }, [navigate, isLoggingOut]);

  const contextValue = {
    session,
    profile,
    updateProfile,
    logout,
    isProfileCreated,
    loading,
    error,
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

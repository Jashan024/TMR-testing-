import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { LinkIcon, PencilIcon, ShareIcon, CheckCircleIcon, EnvelopeIcon, DocumentIcon, EyeIcon, DownloadIcon, MapPinIcon, BriefcaseIcon, AcademicCapIcon, TagIcon, UserIcon } from '../components/Icons';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile, DocumentFile } from '../types';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col justify-center items-center h-[60vh] py-20">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-emerald-400 animate-spin"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-l-2 border-r-2 border-emerald-600 animate-spin-slow opacity-50"></div>
    </div>
    <p className="mt-6 text-emerald-400 font-medium tracking-widest animate-pulse">LOADING PROFILE</p>
  </div>
);

// Custom hook for scroll reveal animations
const useReveal = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

const RevealSection: React.FC<{ children: React.ReactNode; className?: string; animation?: 'fade' | 'left' | 'right'; id?: string }> = ({ children, className = '', animation = 'fade', id }) => {
  const { ref, isVisible } = useReveal();
  const animationClass = animation === 'left' ? 'animate-slide-in-left' : animation === 'right' ? 'animate-slide-in-right' : 'animate-fade-in-up';

  return (
    <div id={id} ref={ref} className={`${className} scroll-mt-24 ${isVisible ? animationClass : 'reveal-hidden'}`}>
      {children}
    </div>
  );
};

export const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  // Clean the userId to remove any trailing backslashes or invalid characters
  const cleanUserId = userId?.replace(/\\+$/, '').trim();

  // Logged-in user's data from context
  const { session, profile, isProfileCreated, loading: authUserLoading, error: authUserError } = useProfile();

  // State for publicly fetched profile
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // State for share button
  const [copied, setCopied] = useState(false);

  // State for public documents
  const [publicDocuments, setPublicDocuments] = useState<DocumentFile[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Ref to track if we've fetched this profile to prevent infinite loops
  const fetchedProfileId = useRef<string | null>(null);

  const isMyProfile = cleanUserId === 'me' || (session && profile && cleanUserId === profile.id);
  const profileAlreadyLoaded = !pageLoading && (isMyProfile ? !!profile : (!!publicProfile && publicProfile.id === cleanUserId));

  useEffect(() => {
    // Reset states when userId changes
    if (cleanUserId !== fetchedProfileId.current) {
      setPublicProfile(null);
      setPageError(null);
      fetchedProfileId.current = null;
    }

    const fetchPublicDocuments = async (profileId: string) => {
      if (!supabase) return;

      setDocumentsLoading(true);
      try {
        const { data: docRecords, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', profileId)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Step 1: Set documents immediately with no URLs yet to show the list fast
        setPublicDocuments(docRecords || []);
        setDocumentsLoading(false); // UI can show the list now

        // Step 2: Resolve URLs in background to not block the initial list render.
        // We do this by updating the state with the same records plus URLs as they resolve.
        Promise.all((docRecords || []).map(async (doc) => {
          let url: string | undefined;
          try {
            const { data: signed, error: signedError } = await supabase!.storage
              .from('documents')
              .createSignedUrl(doc.file_path, 60 * 10);
            if (!signedError) url = signed?.signedUrl;
          } catch (_) { }

          if (!url) {
            const { data: urlData } = supabase!.storage.from('documents').getPublicUrl(doc.file_path);
            url = urlData.publicUrl;
          }
          return { ...doc, public_url: url };
        })).then(enhancedDocs => {
          setPublicDocuments(enhancedDocs);
        });

      } catch (error) {
        console.error('Error fetching public documents:', error);
        setDocumentsLoading(false);
      }
    };

    const fetchPublicProfile = async (id: string) => {
      console.log('Starting to fetch public profile for ID:', id);
      setPageLoading(true);
      setPageError(null);
      fetchedProfileId.current = id;

      if (!supabase) {
        setPageError("Application is not connected to a backend service.");
        setPageLoading(false);
        return;
      }

      try {
        console.log('Starting to fetch public profile for ID:', id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        console.log('Supabase response:', { profileData, profileError });

        if (profileError || !profileData) {
          console.log('Profile error details:', profileError);
          if (profileError?.code === 'PGRST116') throw new Error('Profile not found.');
          throw profileError || new Error('Profile not found.');
        }
        console.log('Public profile fetched successfully:', profileData);
        setPublicProfile(profileData);
        setPageLoading(false);

        // Fetch public documents for this profile
        fetchPublicDocuments(id);

      } catch (error: any) {
        console.error('Error fetching public profile:', error);
        setPageError(error.message || 'Failed to load profile.');
        setPageLoading(false);
      }
    };

    // Handle different scenarios
    if (cleanUserId === 'me') {
      // Viewing own profile - use context data
      if (!authUserLoading) {
        setPageLoading(false);
        if (!session) {
          navigate('/auth');
        } else if (session && !isProfileCreated) {
          // Stay on profile page but maybe show a prompt or just let them see the empty state
          // fetchPublicDocuments(profile?.id); 
        } else if (authUserError) {
          setPageError(authUserError);
        } else if (profile?.id) {
          // Fetch public documents for own profile
          fetchPublicDocuments(profile.id);
        }
      }
    } else if (cleanUserId && cleanUserId !== 'me') {
      // Viewing someone else's profile - fetch from database
      // Only fetch if we haven't already fetched this profile
      if (fetchedProfileId.current !== cleanUserId) {
        console.log('Need to fetch profile for userId:', cleanUserId);
        fetchPublicProfile(cleanUserId);
      } else {
        console.log('Profile already fetched for userId:', cleanUserId);
        setPageLoading(false);
      }
    } else {
      setPageError("Invalid profile URL.");
      setPageLoading(false);
    }

  }, [cleanUserId, profile?.id, authUserLoading]); // Listen for profile ID changes (vital for /profile/me)

  const handleContactCandidate = () => {
    // Since messaging is coming soon, show an alert or redirect
    alert('Messaging feature is coming soon! You will be able to contact candidates directly through our platform.');
  };

  const handleShare = () => {
    const profileToShare = isMyProfile ? profile : publicProfile;
    if (!profileToShare) return;

    const shareUrl = `${window.location.origin}/#/profile/${profileToShare.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const profileToDisplay = isMyProfile ? profile : publicProfile;

  const isLoading = pageLoading || (isMyProfile && authUserLoading);

  // Debug logging
  console.log('PublicProfilePage Debug:', {
    userId,
    cleanUserId,
    isMyProfile,
    pageLoading,
    authUserLoading,
    isLoading,
    profileToDisplay: !!profileToDisplay,
    publicProfile: !!publicProfile,
    profile: !!profile
  });

  if (pageError) {
    return <div className="text-center p-10 text-red-400">{pageError}</div>;
  }

  // Always show loading spinner if no profile is available yet
  if (!profileToDisplay) {
    return (
      <div className="container mx-auto px-6 max-w-4xl">
        <LoadingSpinner />
      </div>
    );
  }


  return (
    <>
      {/* Minimal Header for External Profile Views */}
      {!isMyProfile && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
          <div className="container mx-auto px-6 py-4">
            <div className="text-2xl font-bold text-zinc-900 tracking-tighter">
              TMR<span className="text-emerald-500">.</span>
            </div>
          </div>
        </header>
      )}

      <div className={`py-12 sm:py-20 transition-all duration-300 ${!isMyProfile ? 'pt-24' : ''}`}>
        <div className="container mx-auto px-6 max-w-5xl">
          {profileToDisplay && (
            <main className="relative">
              {/* Floating Side Nav for Desktop - Only for own profile */}
              {isMyProfile && (
                <nav className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-40">
                  {[
                    ...(profileToDisplay.bio ? ['About'] : []),
                    'Experience',
                    'Expertise',
                    'Documents'
                  ].map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase()}`}
                      className="group flex items-center gap-4 transition-all"
                    >
                      <span className="w-2 h-2 rounded-full bg-zinc-200 group-hover:bg-emerald-500 group-hover:scale-150 transition-all duration-300"></span>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                        {item}
                      </span>
                    </a>
                  ))}
                </nav>
              )}

              {/* Hero Section */}
              <section className="relative mb-24 pt-8 animate-fade-in-up">
                {/* Glass Background Highlight */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-96 bg-emerald-500/10 blur-[150px] -z-10 rounded-full opacity-60"></div>

                <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-12">
                  <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                    <div className="relative group p-1 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 shadow-xl">
                      {profileToDisplay.photo_url ? (
                        <img src={profileToDisplay.photo_url} alt={profileToDisplay.name} className="relative w-40 h-40 md:w-52 md:h-52 rounded-full object-cover border-8 border-white shadow-2xl" />
                      ) : (
                        <div className="relative w-40 h-40 md:w-52 md:h-52 bg-zinc-100 rounded-full flex items-center justify-center text-7xl font-bold text-emerald-500 border-8 border-white shadow-2xl">
                          {profileToDisplay.name?.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white shadow-xl ring-4 ring-emerald-500/10"></div>
                    </div>

                    <div className="space-y-4">
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                        Available for opportunities
                      </div>
                      <h1 className="text-5xl md:text-7xl font-extrabold text-zinc-900 tracking-tighter">
                        {profileToDisplay.name}
                      </h1>
                      <p className="text-2xl md:text-3xl font-light text-zinc-600 tracking-tight">
                        {profileToDisplay.title}
                      </p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                        <div className="inline-flex items-center px-5 py-2 rounded-2xl bg-white border border-zinc-200 text-zinc-700 font-medium shadow-sm">
                          <MapPinIcon className="w-5 h-5 mr-3 text-emerald-500" />
                          <span>{profileToDisplay.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {isMyProfile ? (
                      <>
                        <Button onClick={handleShare} variant="secondary" className="px-8 py-3.5 rounded-2xl">
                          {copied ? <CheckCircleIcon className="w-5 h-5 mr-3 text-green-400" /> : <ShareIcon className="w-5 h-5 mr-3" />}
                          {copied ? 'Link Copied' : 'Share Profile'}
                        </Button>
                        <Button to="/onboarding" variant="primary" className="px-8 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20">
                          <PencilIcon className="w-5 h-5 mr-3" />
                          Edit Profile
                        </Button>
                      </>
                    ) : (
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-[2rem] blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
                        <Button onClick={handleContactCandidate} variant="primary" className="relative w-full px-10 py-4 rounded-[1.8rem]">
                          <EnvelopeIcon className="w-5 h-5 mr-3" />
                          Connect Now
                        </Button>
                        <span className="absolute -top-4 -right-2 bg-gradient-to-tr from-emerald-500 to-emerald-700 text-white text-[10px] font-bold px-3 py-1 rounded-full border-2 border-white shadow-xl animate-bounce">
                          BETA
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Main Content Grid */}
              <div className="flex flex-col gap-12">
                {/* About Section */}
                {profileToDisplay.bio && (
                  <RevealSection id="about" animation="fade">
                    <Card className="p-10 border-zinc-200 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <UserIcon className="w-32 h-32 text-zinc-900" />
                      </div>
                      <h2 className="text-3xl font-bold text-zinc-900 mb-6 flex items-center">
                        <span className="w-1.5 h-8 bg-emerald-500 mr-4 rounded-full"></span>
                        Professional Bio
                      </h2>
                      <p className="text-xl text-zinc-600 leading-relaxed font-light whitespace-pre-wrap max-w-3xl">
                        {profileToDisplay.bio}
                      </p>
                    </Card>
                  </RevealSection>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                  {/* LEFT COLUMN: Experience & Preferences */}
                  <div className="md:col-span-5 space-y-12">
                    <RevealSection id="experience" animation="left">
                      <Card className="p-8 border-zinc-200">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-8 flex items-center">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mr-4 border border-emerald-100">
                            <BriefcaseIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          Career Overview
                        </h2>
                        <div className="space-y-8">
                          <div>
                            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Focus Areas</h3>
                            <div className="flex flex-wrap gap-2">
                              {(profileToDisplay.roles || []).map(role => (
                                <span key={role} className="text-xs font-bold text-emerald-600 py-1.5 px-4 rounded-full bg-emerald-50 border border-emerald-100">{role}</span>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-zinc-100">
                            <div>
                              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Industry</h3>
                              <p className="text-lg text-zinc-900 font-semibold">{profileToDisplay.industry}</p>
                            </div>
                            <div>
                              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Professionalism</h3>
                              <p className="text-lg text-zinc-900 font-semibold">{profileToDisplay.experience} Years</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </RevealSection>

                    <RevealSection animation="left">
                      <div className="bg-white rounded-[2/5rem] p-8 border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-50"></div>
                        <h2 className="text-xl font-bold text-zinc-900 mb-6">Quick Overview</h2>
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-500">Current Industry</span>
                            <span className="text-sm font-bold text-zinc-900">{profileToDisplay.industry}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-500">Experience</span>
                            <span className="text-sm font-bold text-zinc-900">{profileToDisplay.experience} Years</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-500">Current Location</span>
                            <span className="text-sm font-bold text-zinc-900">{profileToDisplay.location}</span>
                          </div>
                        </div>
                      </div>
                    </RevealSection>
                  </div>

                  {/* RIGHT COLUMN: Skills & Documents */}
                  <div className="md:col-span-7 space-y-12">
                    <RevealSection id="expertise" animation="right">
                      <Card className="p-8 border-zinc-200">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-8 flex items-center">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mr-4 border border-emerald-100">
                            <TagIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          Skills
                        </h2>
                        <div className="flex flex-wrap gap-3">
                          {(profileToDisplay.skills || []).map(skill => (
                            <span key={skill} className="px-5 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-700 font-semibold hover:border-emerald-500/50 hover:bg-emerald-50 hover:text-emerald-600 hover:-translate-y-1 transition-all cursor-default shadow-sm text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </Card>
                    </RevealSection>

                    <RevealSection id="docs" animation="right">
                      <Card className="p-8 relative overflow-hidden border-zinc-200">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-8 flex items-center">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mr-4 border border-emerald-100">
                            <DocumentIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          Documents
                        </h2>
                        {documentsLoading ? (
                          <div className="flex justify-center py-12">
                            <div className="h-10 w-10 rounded-full border-t-2 border-emerald-400 animate-spin"></div>
                          </div>
                        ) : publicDocuments.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4">
                            {publicDocuments.map(doc => (
                              <div className="flex items-center justify-between p-5 rounded-3xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:border-emerald-500/30 hover:shadow-lg transition-all duration-500 group">
                                <div className="flex items-center min-w-0">
                                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mr-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm">
                                    <DocumentIcon className="w-7 h-7 text-emerald-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-zinc-900 truncate text-lg">{doc.name}</p>
                                    <div className="flex items-center gap-4 mt-1">
                                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{doc.size}</span>
                                      <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
                                      <span className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest">Verified Digital Copy</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <a
                                    href={doc.public_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-emerald-600 bg-white hover:bg-emerald-50 rounded-2xl shadow-sm transition-all active:scale-90 border border-zinc-100"
                                    title="View"
                                  >
                                    <EyeIcon className="w-6 h-6" />
                                  </a>
                                  <a
                                    href={doc.public_url}
                                    download
                                    className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-emerald-500 bg-white hover:bg-emerald-50 rounded-2xl shadow-sm transition-all active:scale-90 border border-zinc-100"
                                    title="Download"
                                  >
                                    <DownloadIcon className="w-6 h-6" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-zinc-200">
                            <DocumentIcon className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                            <p className="text-zinc-400 text-lg font-light italic">No public documents shared.</p>
                          </div>
                        )}
                      </Card>
                    </RevealSection>
                  </div>
                </div>
              </div>
            </main>
          )}
        </div>
      </div>
    </>
  );
};

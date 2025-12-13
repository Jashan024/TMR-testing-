import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { LinkIcon, PencilIcon, ShareIcon, CheckCircleIcon, EnvelopeIcon, DocumentIcon, EyeIcon, DownloadIcon } from '../components/Icons';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile, DocumentFile } from '../types';

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
    </div>
);

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
            
            // Enhance documents with URLs.
            // Prefer signed URLs (works with private buckets if policy allows reads),
            // and fall back to public URLs if the bucket is public.
            const enhancedDocs = await Promise.all(
                (docRecords || []).map(async (doc) => {
                    let url: string | undefined;
                    try {
                        const { data: signed, error: signedError } = await supabase!.storage
                            .from('documents')
                            .createSignedUrl(doc.file_path, 60 * 10);
                        if (!signedError) url = signed?.signedUrl;
                    } catch (_) {}

                    if (!url) {
                        const { data: urlData } = supabase!.storage.from('documents').getPublicUrl(doc.file_path);
                        url = urlData.publicUrl;
                    }

                    return { ...doc, public_url: url };
                })
            );
            
            setPublicDocuments(enhancedDocs);
        } catch (error) {
            console.error('Error fetching public documents:', error);
        } finally {
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
                if(profileError?.code === 'PGRST116') throw new Error('Profile not found.');
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
                navigate('/onboarding');
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

  }, [cleanUserId]); // Only depend on cleanUserId
  
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
      <div className="py-12 sm:py-16 transition-all duration-300">
        <div className="container mx-auto px-6 max-w-4xl animate-fade-in-up">
            {profileToDisplay && (
                <main>
                {/* Header Section */}
                <section className="relative mb-12">
                  <div className="sm:absolute sm:top-0 sm:right-0 mb-6 sm:mb-0 flex flex-col sm:flex-row gap-3">
                    {/* Show different buttons based on who's viewing */}
                    {isMyProfile ? (
                      // User viewing their own profile - show Share and Edit
                      <>
                        <Button onClick={handleShare} variant="secondary" className="px-4 py-2 w-full sm:w-auto">
                          {copied ? <CheckCircleIcon className="w-4 h-4 mr-2 text-green-400" /> : <ShareIcon className="w-4 h-4 mr-2" />}
                          {copied ? 'Link Copied!' : 'Share Profile'}
                        </Button>
                        <Button to="/onboarding" variant="outline" className="px-4 py-2 w-full sm:w-auto">
                          <PencilIcon className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      </>
                    ) : (
                      // Recruiter or anyone viewing candidate profile - show Contact button
                      <div className="relative">
                        <Button onClick={handleContactCandidate} variant="primary" className="px-4 py-2 w-full sm:w-auto">
                          <EnvelopeIcon className="w-4 h-4 mr-2" />
                          Contact Candidate
                        </Button>
                        <span className="absolute -top-1.5 -right-6 bg-cyan-900/80 text-cyan-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-cyan-700">
                          SOON
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                      {profileToDisplay.photo_url ? (
                          <img src={profileToDisplay.photo_url} alt={profileToDisplay.name} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-gray-600" />
                      ) : (
                          <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-5xl font-bold text-cyan-400 mx-auto border-4 border-gray-600">
                              {profileToDisplay.name?.charAt(0)}
                          </div>
                      )}
                      <h1 className="text-4xl font-bold text-white mt-4">{profileToDisplay.name}</h1>
                      <p className="text-xl text-gray-300">{profileToDisplay.title}</p>
                      {profileToDisplay.portfolio_url && (
                           <a href={profileToDisplay.portfolio_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors">
                               <LinkIcon className="w-5 h-5 mr-2" />
                               <span>Portfolio / Website</span>
                           </a>
                      )}
                  </div>
                </section>
      
                {/* Bio Section */}
                 <Card className="mb-8">
                      <h2 className="text-2xl font-semibold text-white mb-3">About Me</h2>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{profileToDisplay.bio}</p>
                 </Card>
      
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* LEFT COLUMN */}
                  <div className="md:col-span-1 space-y-8">
                      <Card>
                        <h2 className="text-xl font-semibold text-white mb-4">Preferences</h2>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-400">Location</h3>
                            <p className="text-gray-200">{profileToDisplay.location}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-400">Open to Roles</h3>
                            <ul className="list-disc list-inside text-gray-200 space-y-1 mt-1">
                              {(profileToDisplay.roles || []).map(role => <li key={role}>{role}</li>)}
                            </ul>
                          </div>
                        </div>
                      </Card>
                      <Card>
                        <h2 className="text-xl font-semibold text-white mb-4">Experience</h2>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-400">Industry</h3>
                            <p className="text-gray-200">{profileToDisplay.industry}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-400">Years of Experience</h3>
                            <p className="text-gray-200">{profileToDisplay.experience} years</p>
                          </div>
                        </div>
                      </Card>
                  </div>
      
                  {/* RIGHT COLUMN */}
                  <div className="md:col-span-2 space-y-8">
                       <Card>
                        <h2 className="text-xl font-semibold text-white mb-4">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                          {(profileToDisplay.skills || []).map(skill => (
                            <span key={skill} className="bg-gray-700 text-gray-300 text-sm font-medium px-3 py-1.5 rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </Card>
                       <Card>
                        <h2 className="text-xl font-semibold text-white mb-4">Certifications & Licenses</h2>
                        <div className="flex flex-wrap gap-2">
                          {(profileToDisplay.certifications || []).length > 0 ? (profileToDisplay.certifications || []).map(cert => (
                            <span key={cert} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-transform hover:scale-105">
                              {cert}
                            </span>
                          )) : <p className="text-gray-400 text-sm">No certifications listed.</p>}
                        </div>
                      </Card>
                      
                      {/* Documents Section */}
                      <Card>
                        <h2 className="text-xl font-semibold text-white mb-4">Documents</h2>
                        {documentsLoading ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                          </div>
                        ) : publicDocuments.length > 0 ? (
                          <div className="space-y-3">
                            {publicDocuments.map(doc => (
                              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-700/80">
                                <div className="flex items-center min-w-0">
                                  <DocumentIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                  <div className="ml-3 min-w-0">
                                    <p className="font-medium text-white truncate">{doc.name}</p>
                                    <p className="text-xs text-gray-400">{doc.size}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                                  <a 
                                    href={doc.public_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                                    title="View Document"
                                  >
                                    <EyeIcon className="w-5 h-5" />
                                  </a>
                                  <a 
                                    href={doc.public_url} 
                                    download
                                    className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                                    title="Download Document"
                                  >
                                    <DownloadIcon className="w-5 h-5" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">No public documents available.</p>
                        )}
                      </Card>
                  </div>
                </div>
              </main>
            )}
        </div>
      </div>
    </>
  );
};

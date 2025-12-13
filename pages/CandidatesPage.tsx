

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile } from '../types';
import CandidateCard from '../components/CandidateCard';
import { SearchIcon, LoaderIcon, BriefcaseIcon, MapPinIcon, CalendarDaysIcon, TagIcon } from '../components/Icons';
import Card from '../components/Card';
import { Input } from '../components/Input';
import Button from '../components/Button';
import MagicLoader from '../components/MagicLoader';

const CandidatesPage: React.FC = () => {
    const { profile, loading: profileLoading } = useProfile();
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for input fields
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [experience, setExperience] = useState('');
    const [skills, setSkills] = useState('');

    // State for applied filters
    const [appliedFilters, setAppliedFilters] = useState({
        title: '',
        location: '',
        experience: '',
        skills: '',
    });

    useEffect(() => {
        // Redirect non-recruiters or logged-out users
        if (!profileLoading && (!profile || profile.role !== 'recruiter')) {
            navigate('/auth?role=recruiter');
        }
    }, [profile, profileLoading, navigate]);

    useEffect(() => {
        const fetchCandidates = async () => {
            if (!supabase) {
                setError("Application is not connected to a backend service.");
                setLoading(false);
                return;
            }
            if (profile && profile.role === 'recruiter') {
                try {
                    setLoading(true);
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('role', 'candidate')
                        .not('name', 'is', null) // Only show profiles that have been onboarded
                        .order('updated_at', { ascending: false });

                    if (error) throw error;
                    setCandidates(data || []);
                } catch (err: any) {
                    setError(err.message || 'Failed to fetch candidates.');
                } finally {
                    setLoading(false);
                }
            }
        };

        if (!profileLoading) {
            fetchCandidates();
        }
    }, [profile, profileLoading]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        // Simulate a search delay for a better UX, allowing the loader to be visible.
        setTimeout(() => {
            setAppliedFilters({ title, location, experience, skills });
            setIsSearching(false);
        }, 1200);
    };

    const handleClear = () => {
        setTitle('');
        setLocation('');
        setExperience('');
        setSkills('');
        setAppliedFilters({ title: '', location: '', experience: '', skills: '' });
    };

    const filteredCandidates = candidates.filter(c => {
        const { title, location, experience, skills } = appliedFilters;
        const searchTitle = title.trim().toLowerCase();
        const searchLocation = location.trim().toLowerCase();
        const searchExperience = experience.trim();
        const searchSkills = skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

        if (searchTitle && !c.title?.toLowerCase().includes(searchTitle)) {
            return false;
        }
        if (searchLocation && !c.location?.toLowerCase().includes(searchLocation)) {
            return false;
        }
        
        if (searchExperience && /^\d+$/.test(searchExperience)) {
            const minExp = parseInt(searchExperience, 10);
            const candidateExp = c.experience ? parseInt(c.experience, 10) : -1;
            if (isNaN(candidateExp) || candidateExp < minExp) {
                return false;
            }
        }

        if (searchSkills.length > 0) {
            const candidateSkills = c.skills?.map(s => s.toLowerCase()) || [];
            if (!searchSkills.every(reqSkill => candidateSkills.some(candSkill => candSkill.includes(reqSkill)))) {
                return false;
            }
        }
        return true;
    });
    
    // Show a global loader while verifying the user's role
    if (profileLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-80px)]">
                <LoaderIcon className="w-8 h-8" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl animate-fade-in-up">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-white">Find Candidates</h1>
                <p className="text-xl text-gray-300 mt-2">Use the filters below to find talent matching your criteria.</p>
            </header>

            <Card className="p-6 mb-10">
                <form onSubmit={handleSearch}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        <Input label="Job Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" icon={<BriefcaseIcon />} />
                        <Input label="Location" name="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote, USA" icon={<MapPinIcon />} />
                        <Input label="Minimum Experience (years)" name="experience" type="number" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5" min="0" icon={<CalendarDaysIcon />} />
                        <Input label="Skills" name="skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, TypeScript, Node.js" helperText="Enter skills separated by commas." icon={<TagIcon />} />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-6 pt-6 border-t border-gray-700">
                        <Button type="button" variant="secondary" onClick={handleClear} className="w-full sm:w-auto">
                            Clear Filters
                        </Button>
                        <Button type="submit" variant="primary" className="w-full sm:w-auto" loading={isSearching}>
                            {!isSearching && <SearchIcon className="w-5 h-5 mr-2" />}
                            {isSearching ? 'Searching...' : 'Search'}
                        </Button>
                    </div>
                </form>
            </Card>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <LoaderIcon className="w-10 h-10" />
                </div>
            ) : isSearching ? (
                 <MagicLoader text="Finding the best candidates..." />
            ) : error ? (
                <div className="text-center p-10 text-red-400">{error}</div>
            ) : (
                <>
                    {filteredCandidates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredCandidates.map(candidate => (
                                <CandidateCard key={candidate.id} profile={candidate} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-800/50 rounded-lg">
                            <h3 className="text-xl font-semibold text-white">No Candidates Found</h3>
                            <p className="text-gray-400 mt-2">
                                Try adjusting your search filters to find more results.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CandidatesPage;

import React, { useState } from 'react';
import Card from '../components/Card';
import { BriefcaseIcon, MapPinIcon, SearchIcon, InformationCircleIcon } from '../components/Icons';
import { Input } from '../components/Input';
import Button from '../components/Button';
import MagicLoader from '../components/MagicLoader';
import JobCard from '../components/JobCard';
import type { SerpApiJob } from '../types';

// =============================================================================
// SerpApi Configuration
// Get your free API key from: https://serpapi.com/dashboard
// =============================================================================
const SERPAPI_KEY: string = "8e63efd5616fbe3d082fde046c9f143a45a40d29cbe74a335c37e3f0a225c6b6";

const JobSearchPage: React.FC = () => {
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [jobs, setJobs] = useState<SerpApiJob[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Helper functions to extract job information from search results
    const extractCompanyName = (title: string, snippet: string) => {
        const text = `${title} ${snippet}`.toLowerCase();

        // Try to extract company name from common patterns
        const patterns = [
            /(?:at|@|from|hiring at)\s+([a-zA-Z\s&.,'-]+?)(?:\s|$|,|\.|in|is)/,
            /([a-zA-Z\s&.,'-]+?)\s+(?:is hiring|hiring|jobs|careers)/,
            /([a-zA-Z\s&.,'-]+?)\s+(?:in|at)\s+(?:new york|california|texas|florida)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1].length > 2 && match[1].length < 50) {
                return match[1].trim();
            }
        }

        return null;
    };

    const extractDate = (snippet: string) => {
        const dateMatch = snippet.match(/(\d+\s+(?:days?|hours?|weeks?)\s+ago)/i);
        return dateMatch ? dateMatch[1] : null;
    };

    const extractJobType = (snippet: string) => {
        const typeMatch = snippet.match(/(full.?time|part.?time|contract|remote|hybrid|permanent|temporary)/i);
        return typeMatch ? typeMatch[1] : null;
    };

    const extractSalary = (snippet: string) => {
        const salaryMatch = snippet.match(/\$[\d,]+(?:k|K)?(?:\s*-\s*\$[\d,]+(?:k|K)?)?/);
        return salaryMatch ? salaryMatch[0] : null;
    };

    // This check determines if the placeholder key above has been replaced.
    const isApiKeyConfigured = SERPAPI_KEY && SERPAPI_KEY !== 'YOUR_SERPAPI_API_KEY';

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        setJobs([]);

        if (!isApiKeyConfigured) {
            setError('The SerpApi key is not configured. Please add your key to the JobSearchPage.tsx file.');
            setIsLoading(false);
            return;
        }

        const cacheKey = `serpapi_jobs_${title.trim().toLowerCase()}_${location.trim().toLowerCase()}`;

        try {
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                setJobs(parsedData.jobs);
                setIsLoading(false);
                return;
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Use a reliable CORS proxy for SerpApi with better search parameters
            const searchQuery = title.trim();
            const searchLocation = location.trim();

            // Build SerpApi URL using Google search engine with job-specific queries
            // Search for specific job postings, not general job pages
            const jobSearchQuery = `"${searchQuery}" "${searchLocation}" (intitle:"hiring" OR intitle:"job" OR intitle:"career") (site:indeed.com/viewjob OR site:linkedin.com/jobs/view OR site:glassdoor.com/Job OR site:ziprecruiter.com/c OR site:monster.com/jobs)`;
            const serpApiUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(jobSearchQuery)}&api_key=${SERPAPI_KEY}&num=20&gl=us&hl=en`;

            // Try multiple CORS proxies for better reliability
            const proxies = [
                `https://api.allorigins.win/raw?url=${encodeURIComponent(serpApiUrl)}`,
                `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(serpApiUrl)}`,
                `https://cors.bridged.cc/${serpApiUrl}`,
                `https://proxy.cors.sh/${serpApiUrl}`,
                `https://corsproxy.org/?${encodeURIComponent(serpApiUrl)}`
            ];

            console.log('Searching for:', searchQuery, 'in', searchLocation);

            let response;
            let lastError;

            for (const proxyUrl of proxies) {
                try {
                    console.log(`Trying proxy: ${proxyUrl.split('/')[2]}`);
                    response = await fetch(proxyUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                        },
                    });

                    if (response.ok) {
                        console.log(`Successfully connected via ${proxyUrl.split('/')[2]}`);
                        break;
                    } else {
                        console.log(`Proxy ${proxyUrl.split('/')[2]} returned status: ${response.status}`);
                    }
                } catch (error) {
                    console.log(`Proxy ${proxyUrl.split('/')[2]} failed:`, error.message);
                    lastError = error;
                    continue;
                }
            }

            if (!response || !response.ok) {
                // Try direct SerpApi call as last resort
                console.log('All proxies failed, trying direct SerpApi call...');
                try {
                    response = await fetch(serpApiUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        throw new Error(`Direct SerpApi call failed with status: ${response.status}`);
                    }
                    console.log('Direct SerpApi call succeeded');
                } catch (directError) {
                    throw new Error(`All CORS proxies and direct call failed. This might be due to rate limiting. Please wait a few minutes and try again. Last error: ${lastError?.message || directError?.message || 'Unknown error'}`);
                }
            }

            const data = await response.json();
            console.log('SerpApi response:', data);
            console.log('Search results from SerpApi:', data.organic_results);

            if (data.error) {
                throw new Error(data.error);
            }

            const searchResults = data.organic_results || [];

            // Convert Google search results to job format
            const jobResults = searchResults.map((result, index) => ({
                job_id: `search_${index}`,
                title: result.title || 'Job Opportunity',
                company_name: extractCompanyName(result.title, result.snippet) || 'Company',
                location: searchLocation,
                via: result.link,
                description: result.snippet || '',
                thumbnail: result.thumbnail,
                detected_extensions: {
                    posted_at: extractDate(result.snippet),
                    schedule_type: extractJobType(result.snippet),
                    salary: extractSalary(result.snippet)
                }
            }));

            // Filter out aggregation pages and only show individual job postings
            const validJobs = jobResults.filter(job => {
                const title = job.title.toLowerCase();
                const url = job.via.toLowerCase();
                const description = job.description.toLowerCase();

                // Must be a specific job posting URL (target individual job pages)
                const isSpecificJob = url.includes('/viewjob') ||           // Indeed individual jobs
                    url.includes('/jobs/view/') ||         // LinkedIn individual jobs
                    url.includes('/Job/') ||              // Glassdoor individual jobs
                    url.includes('/c/') ||                // ZipRecruiter individual jobs
                    url.includes('/jobs/') ||             // Monster individual jobs
                    (url.includes('indeed.com') && url.includes('/viewjob')) ||
                    (url.includes('linkedin.com') && url.includes('/jobs/view/')) ||
                    (url.includes('glassdoor.com') && url.includes('/Job/')) ||
                    (url.includes('ziprecruiter.com') && url.includes('/c/'));

                // Exclude obvious aggregation pages (less strict)
                const isNotAggregation = !title.includes('+') &&
                    !title.includes('jobs available') &&
                    !title.includes('jobs, employment') &&
                    !title.includes('leverage your professional network') &&
                    !title.includes('top 20000') &&
                    !title.includes('jobs in new york');

                // Must have valid URL
                const hasValidUrl = job.via &&
                    job.via.startsWith('http') &&
                    !job.via.includes('localhost') &&
                    job.via.length > 10;

                const isValid = isSpecificJob && isNotAggregation && hasValidUrl;
                console.log(`Job: "${job.title}" - URL: "${job.via}" - Specific: ${isSpecificJob} - Not Aggregation: ${isNotAggregation} - Valid URL: ${hasValidUrl} - Final: ${isValid}`);
                return isValid;
            });

            console.log(`Total search results: ${searchResults.length}, Valid job URLs: ${validJobs.length}`);

            // If no jobs pass the strict filter, try a more lenient approach
            let finalJobs = validJobs;
            if (validJobs.length === 0 && searchResults.length > 0) {
                console.log('No jobs passed strict filter, trying lenient filter...');
                finalJobs = jobResults.filter(job => {
                    const hasValidUrl = job.via &&
                        job.via.startsWith('http') &&
                        !job.via.includes('localhost') &&
                        job.via.length > 10;

                    const title = job.title.toLowerCase();
                    const url = job.via.toLowerCase();

                    // Even in lenient mode, try to avoid obvious job board search pages
                    const isNotObviousAggregation = !title.includes('+') &&
                        !title.includes('jobs available') &&
                        !title.includes('leverage your professional network') &&
                        !url.includes('/jobs/') &&  // Avoid job board search pages
                        !url.includes('/search') &&
                        !url.includes('/browse');

                    console.log(`Lenient filter - Job: "${job.title}" - URL: "${job.via}" - Valid URL: ${hasValidUrl} - Not Aggregation: ${isNotObviousAggregation}`);
                    return hasValidUrl && isNotObviousAggregation;
                });
                console.log(`Lenient filter results: ${finalJobs.length} jobs`);
            }

            if (finalJobs.length === 0) {
                throw new Error(`No job postings found for "${searchQuery}" in "${searchLocation}". Try different keywords or location.`);
            }

            setJobs(finalJobs);
            sessionStorage.setItem(cacheKey, JSON.stringify({ jobs: finalJobs }));

        } catch (err: any) {
            console.error('Job search error:', err);

            // Provide specific error messages for real API issues
            if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                setError('Network connection failed. Please check your internet connection and try again.');
            } else if (err.message.includes('CORS')) {
                setError('CORS error: Unable to fetch jobs. This might be a browser security restriction.');
            } else if (err.message.includes('401') || err.message.includes('403')) {
                setError('API key is invalid or expired. Please check your SerpApi configuration.');
            } else if (err.message.includes('429')) {
                setError('API rate limit exceeded. Please try again in a few minutes.');
            } else {
                setError(err.message || 'An unexpected error occurred while searching for jobs.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-6xl animate-fade-in-up">
            <header className="text-center mb-8 sm:mb-10">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 leading-tight">Find Your Next Job</h1>
                <p className="text-lg sm:text-xl text-zinc-600 mt-2 max-w-2xl mx-auto">Discover opportunities from all over the web.</p>
            </header>

            <Card className="p-4 sm:p-6 mb-8 sm:mb-10">
                <form onSubmit={handleSearch}>
                    {!isApiKeyConfigured && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start">
                            <InformationCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-amber-600" />
                            <div className="text-sm">
                                <strong>API Key Required:</strong>
                                <ol className="mt-2 ml-4 list-decimal space-y-1">
                                    <li>Go to <a href="https://serpapi.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">serpapi.com/dashboard</a></li>
                                    <li>Sign up for a free account</li>
                                    <li>Copy your API key</li>
                                    <li>Replace <code className="bg-white border border-amber-200 px-1 rounded">YOUR_SERPAPI_API_KEY_HERE</code> in JobSearchPage.tsx</li>
                                </ol>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <Input
                                label="Job Title / Keyword"
                                name="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. nurse, software engineer, teacher"
                                icon={<BriefcaseIcon />}
                                required
                            />
                            <div className="mt-2 text-xs text-zinc-500">
                                Try: "nurse", "software engineer", "teacher", "marketing"
                            </div>
                        </div>
                        <div>
                            <Input
                                label="Location"
                                name="location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. New York, Remote, California"
                                icon={<MapPinIcon />}
                                required
                            />
                            <div className="mt-2 text-xs text-zinc-500">
                                Try: "New York", "Remote", "California", "Texas"
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-6 pt-6 border-t border-zinc-100">
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full sm:w-auto"
                            loading={isLoading}
                            disabled={isLoading || !isApiKeyConfigured}
                        >
                            {!isLoading && <SearchIcon className="w-5 h-5 mr-2" />}
                            {isLoading ? 'Searching...' : 'Search Jobs'}
                        </Button>
                    </div>
                </form>
            </Card>

            {isLoading && <MagicLoader text="Searching for jobs across the web..." />}
            {error && (
                <div className="text-center p-6 sm:p-10 text-red-600 bg-red-50 border border-red-100 rounded-lg mb-8">
                    <div className="max-w-md mx-auto">
                        <h3 className="font-semibold mb-2">Search Error</h3>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {!isLoading && !error && hasSearched && (
                jobs.length > 0 ? (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">
                                Found {jobs.length} job{jobs.length !== 1 ? 's' : ''}
                            </h2>
                        </div>
                        {jobs.map(job => (
                            <JobCard key={job.job_id} job={job} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 sm:py-16 bg-white border border-zinc-200 rounded-[2rem] shadow-sm">
                        <BriefcaseIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-zinc-200" />
                        <h3 className="mt-4 text-lg sm:text-xl font-semibold text-zinc-900">No Jobs Found</h3>
                        <p className="mt-2 text-zinc-600 text-sm sm:text-base">Try adjusting your search keywords or location.</p>
                        <div className="mt-4 text-xs text-zinc-500">
                            <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px] mb-2">Suggestions</p>
                            <ul className="mt-1 space-y-1">
                                <li>Try broader job titles (e.g., "nurse" instead of "ICU nurse")</li>
                                <li>Use different location formats (e.g., "New York" or "NYC")</li>
                                <li>Check spelling and try synonyms</li>
                            </ul>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default JobSearchPage;
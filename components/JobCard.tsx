import React from 'react';
import type { SerpApiJob } from '../types';
import { BriefcaseIcon, BuildingOfficeIcon, CalendarDaysIcon, MapPinIcon } from './Icons';

const JobCard: React.FC<{ job: SerpApiJob }> = ({ job }) => {
    const createSnippet = (html: string) => {
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 150 ? text.substring(0, 150) + '...' : text;
    };

    return (
        <a 
            href={job.via}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gray-800/60 backdrop-blur-lg border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1 group"
        >
            <div className="flex flex-col lg:flex-row items-start gap-3 sm:gap-4">
                {job.thumbnail && (
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-lg flex items-center justify-center p-1 border border-gray-700">
                        <img src={job.thumbnail} alt={`${job.company_name} logo`} className="w-full h-full object-contain" />
                    </div>
                )}
                <div className="flex-grow min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">{job.title}</h3>
                    <div className="flex items-center text-gray-400 text-sm mt-1">
                        <BuildingOfficeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{job.company_name}</span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm mt-1">
                        <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                    </div>
                </div>
                <div className="w-full lg:w-auto text-center lg:text-right mt-3 lg:mt-0 flex-shrink-0">
                    <span className="inline-block bg-cyan-500/20 text-cyan-300 text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-transform group-hover:scale-105 group-hover:bg-cyan-500/30">
                        Apply Now &rarr;
                    </span>
                </div>
            </div>
            
            <p className="mt-3 sm:mt-4 text-gray-300 text-sm leading-relaxed line-clamp-3">
                {createSnippet(job.description)}
            </p>

            {(job.detected_extensions?.posted_at || job.detected_extensions?.schedule_type || job.detected_extensions?.salary) && (
                <div className="mt-3 sm:mt-4 flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-2 text-xs text-gray-400 border-t border-gray-700 pt-3 sm:pt-4">
                    {job.detected_extensions.posted_at && (
                        <div className="flex items-center">
                           <CalendarDaysIcon className="w-3.5 h-3.5 mr-1.5" />
                           <span className="truncate">{job.detected_extensions.posted_at}</span>
                        </div>
                    )}
                    {job.detected_extensions.schedule_type && (
                        <div className="flex items-center">
                           <BriefcaseIcon className="w-3.5 h-3.5 mr-1.5" />
                           <span className="truncate">{job.detected_extensions.schedule_type}</span>
                        </div>
                    )}
                    {job.detected_extensions.salary && (
                        <div className="flex items-center text-green-400">
                           <span className="font-medium">{job.detected_extensions.salary}</span>
                        </div>
                    )}
                </div>
            )}
        </a>
    );
};

export default JobCard;

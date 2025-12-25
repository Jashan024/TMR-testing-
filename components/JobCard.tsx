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
            className="block bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 sm:p-8 transition-all duration-500 hover:bg-white/[0.05] hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-2 group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-cyan-500/10 transition-colors"></div>

            <div className="flex flex-col lg:flex-row items-start gap-6 relative z-10">
                {job.thumbnail ? (
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-white p-3 rounded-2xl border border-white/10 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3 overflow-hidden">
                        <img src={job.thumbnail} alt={`${job.company_name} logo`} className="w-full h-full object-contain" />
                    </div>
                ) : (
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                        <BuildingOfficeIcon className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
                    </div>
                )}
                <div className="flex-grow min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 tracking-tight">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        <div className="flex items-center text-gray-400 text-sm font-medium">
                            <BuildingOfficeIcon className="w-4 h-4 mr-2 text-cyan-400/60" />
                            <span className="truncate">{job.company_name}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm font-medium">
                            <MapPinIcon className="w-4 h-4 mr-2 text-cyan-400/60" />
                            <span className="truncate">{job.location}</span>
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-auto text-center lg:text-right mt-4 lg:mt-0 flex-shrink-0">
                    <span className="inline-block bg-white/5 border border-white/10 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all group-hover:bg-cyan-500 group-hover:text-brand-dark group-hover:border-cyan-500 active:scale-95 shadow-lg">
                        Apply Now &rarr;
                    </span>
                </div>
            </div>

            <p className="mt-6 text-gray-400 text-sm sm:text-base leading-relaxed line-clamp-3 font-light relative z-10">
                {createSnippet(job.description)}
            </p>

            {(job.detected_extensions?.posted_at || job.detected_extensions?.schedule_type || job.detected_extensions?.salary) && (
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[10px] text-gray-500 border-t border-white/5 pt-6 relative z-10">
                    {job.detected_extensions.posted_at && (
                        <div className="flex items-center font-bold uppercase tracking-widest">
                            <CalendarDaysIcon className="w-4 h-4 mr-2 text-cyan-500/40" />
                            <span className="truncate">{job.detected_extensions.posted_at}</span>
                        </div>
                    )}
                    {job.detected_extensions.schedule_type && (
                        <div className="flex items-center font-bold uppercase tracking-widest">
                            <BriefcaseIcon className="w-4 h-4 mr-2 text-cyan-500/40" />
                            <span className="truncate">{job.detected_extensions.schedule_type}</span>
                        </div>
                    )}
                    {job.detected_extensions.salary && (
                        <div className="flex items-center text-cyan-400 font-bold uppercase tracking-widest bg-cyan-500/5 px-2 py-1 rounded-md border border-cyan-500/10">
                            <span className="truncate">{job.detected_extensions.salary}</span>
                        </div>
                    )}
                </div>
            )}
        </a>
    );
};

export default JobCard;

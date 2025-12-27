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
            className="block bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-8 transition-all duration-500 hover:border-emerald-300/50 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-2 group relative overflow-hidden shadow-sm"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>

            <div className="flex flex-col lg:flex-row items-start gap-6 relative z-10">
                {job.thumbnail ? (
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-white p-3 rounded-2xl border border-white/10 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3 overflow-hidden">
                        <img src={job.thumbnail} alt={`${job.company_name} logo`} className="w-full h-full object-contain" />
                    </div>
                ) : (
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                        <BuildingOfficeIcon className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                    </div>
                )}
                <div className="flex-grow min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors line-clamp-2 tracking-tight">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        <div className="flex items-center text-gray-400 text-sm font-medium">
                            <BuildingOfficeIcon className="w-4 h-4 mr-2 text-emerald-400/60" />
                            <span className="truncate">{job.company_name}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm font-medium">
                            <MapPinIcon className="w-4 h-4 mr-2 text-emerald-400/60" />
                            <span className="truncate">{job.location}</span>
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-auto text-center lg:text-right mt-4 lg:mt-0 flex-shrink-0">
                    <span className="inline-block bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-bold px-6 py-3 rounded-xl transition-all group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 active:scale-95 shadow-sm">
                        Apply Now &rarr;
                    </span>
                </div>
            </div>

            <p className="mt-6 text-zinc-600 text-sm sm:text-base leading-relaxed line-clamp-3 font-light relative z-10">
                {createSnippet(job.description)}
            </p>

            {(job.detected_extensions?.posted_at || job.detected_extensions?.schedule_type || job.detected_extensions?.salary) && (
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[10px] text-zinc-400 border-t border-zinc-100 pt-6 relative z-10">
                    {job.detected_extensions.posted_at && (
                        <div className="flex items-center font-bold uppercase tracking-widest">
                            <CalendarDaysIcon className="w-4 h-4 mr-2 text-zinc-300" />
                            <span className="truncate">{job.detected_extensions.posted_at}</span>
                        </div>
                    )}
                    {job.detected_extensions.schedule_type && (
                        <div className="flex items-center font-bold uppercase tracking-widest">
                            <BriefcaseIcon className="w-4 h-4 mr-2 text-zinc-300" />
                            <span className="truncate">{job.detected_extensions.schedule_type}</span>
                        </div>
                    )}
                    {job.detected_extensions.salary && (
                        <div className="flex items-center text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                            <span className="truncate">{job.detected_extensions.salary}</span>
                        </div>
                    )}
                </div>
            )}
        </a>
    );
};

export default JobCard;

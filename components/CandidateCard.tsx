import React from 'react';
import { Link } from 'react-router-dom';
import type { UserProfile } from '../types';
import { MapPinIcon, TagIcon } from './Icons';
import Button from './Button';

const Avatar: React.FC<{ photo_url: string; name: string; size?: string }> = ({ photo_url, name, size = 'h-16 w-16' }) => {
    return photo_url ? (
        <img src={photo_url} alt={name} className={`${size} rounded-full object-cover`} />
    ) : (
        <div className={`${size} bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-cyan-400`}>
            {name ? name.charAt(0) : '?'}
        </div>
    );
};

interface CandidateCardProps {
    profile: UserProfile;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ profile }) => {
    return (
        <div className="group bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-xl p-8 flex flex-col h-full transform transition-all duration-500 hover:-translate-y-2 hover:bg-white/[0.05] hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10">
            <div className="flex items-center mb-6">
                <div className="relative">
                    <Avatar photo_url={profile.photo_url} name={profile.name} size="h-20 w-20" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-brand-dark shadow-lg ring-2 ring-green-500/20"></div>
                </div>
                <div className="ml-5">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{profile.name}</h3>
                    <p className="text-sm font-medium text-cyan-500/80 tracking-wide uppercase">{profile.title}</p>
                </div>
            </div>
            <div className="flex-grow space-y-5 text-sm">
                <div className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 border border-white/10 group-hover:border-cyan-500/20">
                        <MapPinIcon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="font-medium">{profile.location}</span>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                        Core Expertise
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(profile.skills || []).slice(0, 3).map(skill => (
                            <span key={skill} className="bg-white/5 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/5 group-hover:border-cyan-500/20 transition-all">
                                {skill}
                            </span>
                        ))}
                        {(profile.skills || []).length > 3 && (
                            <span className="text-gray-500 text-[10px] font-bold flex items-center px-1">
                                +{(profile.skills || []).length - 3} MORE
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/5">
                <Button to={`/profile/${profile.id}`} variant="primary" className="w-full py-4 rounded-2xl font-bold text-sm shadow-lg shadow-cyan-500/10 group-hover:shadow-cyan-500/20 transition-all">
                    View Portfolio
                </Button>
            </div>
        </div>
    );
};

export default CandidateCard;

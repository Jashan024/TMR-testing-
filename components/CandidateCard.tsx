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
        <div className="bg-gray-800/60 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-lg p-6 flex flex-col h-full transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10">
            <div className="flex items-center mb-4">
                <Avatar photo_url={profile.photo_url} name={profile.name} />
                <div className="ml-4">
                    <h3 className="text-lg font-bold text-white">{profile.name}</h3>
                    <p className="text-sm text-gray-300">{profile.title}</p>
                </div>
            </div>
            <div className="flex-grow space-y-4 text-sm">
                <div className="flex items-start">
                    <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-300">{profile.location}</span>
                </div>
                <div className="flex items-start">
                    <TagIcon className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1.5">
                        {(profile.skills || []).slice(0, 4).map(skill => (
                            <span key={skill} className="bg-gray-700 text-gray-300 text-xs font-medium px-2 py-1 rounded">
                                {skill}
                            </span>
                        ))}
                        {(profile.skills || []).length > 4 && (
                            <span className="text-gray-400 text-xs font-medium px-2 py-1">
                                +{(profile.skills || []).length - 4} more
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-6">
                <Button to={`/profile/${profile.id}`} variant="outline" className="w-full">
                    View Profile
                </Button>
            </div>
        </div>
    );
};

export default CandidateCard;

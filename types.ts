export interface UserProfile {
  id: string; // User UUID from Supabase Auth
  updated_at?: string;
  photo_url: string;
  name: string;
  title: string;
  industry: 'IT' | 'Healthcare' | 'Other' | '';
  experience: string;
  location: string;
  bio?: string;
  skills: string[];
  roles?: string[];
  certifications?: string[];
  portfolio_url?: string;
  role: 'candidate' | 'recruiter';
}

export interface SerpApiJob {
  job_id: string;
  title: string;
  company_name: string;
  location: string;
  via: string; // The "Apply" link
  description: string;
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
    salary?: string;
  };
  thumbnail?: string;
}

// FIX: Added DocumentFile interface to resolve missing type error.
export interface DocumentFile {
  id: number;
  user_id: string;
  name: string;
  size: string;
  created_at: string;
  visibility: 'public' | 'private';
  file_path: string;
  public_url?: string;
}

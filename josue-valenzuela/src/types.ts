export type ProjectCategory = 'Soroban' | 'Frontend' | 'Backend' | 'Fullstack' | 'Security' | 'Smart Contracts';
export type JobType = 'Bounty' | 'Gig' | 'Part-time' | 'Full-time';

export interface Applicant {
  id: string;
  developerAddress: string;
  developerName: string;
  developerContact: string;
  proposal: string;
  portfolioUrl?: string;
  appliedAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'paid';
  txHash?: string;
}

export interface Project {
  id: string;
  title: string;
  company: string;
  location: string;
  countryFlag: string;
  type: JobType;
  category: ProjectCategory;
  rewardXlm: number;
  description: string;
  requirements: string[];
  publisherAddress: string;
  applicants: Applicant[];
  status: 'open' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  network: string | null;
  balanceXlm: string | null;
  loading: boolean;
  error: string | null;
}

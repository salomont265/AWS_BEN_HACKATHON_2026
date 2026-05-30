import { apiGet, apiPost } from '../utils/api';
import { USE_FAKE_DATA } from '../constants/env';

export interface Petition {
  petition_id: string;
  post_id: string;
  petition_text: string;
  official: {
    name: string;
    email: string;
    district: string;
  };
  signers: string[];
  signature_count: number;
  status: 'draft' | 'submitted';
  created_at: string;
  submitted_at: string | null;
}

// Called by PostDetailScreen when user taps 'Start a petition'
// official is hardcoded for now — TODO: geocoding lookup
export async function createPetition(data: {
  post_id: string;
  neighborhood: string;
  category: string;
  official: {
    name: string;
    email: string;
    district: string;
  };
}): Promise<Petition> {
  if (USE_FAKE_DATA) return {
    petition_id: 'pet_fake',
    post_id: data.post_id,
    petition_text: 'Dear ' + data.official.name + ',\n\nWe the residents of ' + data.neighborhood + ' are writing to demand action on ' + data.category + ' issues in our neighborhood...',
    official: data.official,
    signers: [],
    signature_count: 0,
    status: 'draft',
    created_at: new Date().toISOString(),
    submitted_at: null,
  };

  return apiPost<Petition>('/petitions', data);
}

// Called by PetitionScreen on mount
export async function fetchPetition(petitionId: string): Promise<Petition> {
  if (USE_FAKE_DATA) return {
    petition_id: petitionId,
    post_id: 'p_fake',
    petition_text: 'Dear Council Member...',
    official: {
      name: 'Council Member Smith',
      email: 'smith@council.nyc.gov',
      district: 'District 7'
    },
    signers: [],
    signature_count: 0,
    status: 'draft',
    created_at: new Date().toISOString(),
    submitted_at: null
  };

  return apiGet<Petition>(`/petitions/${petitionId}`);
}

// Called by PetitionScreen Sign button
export async function signPetition(
  petitionId: string,
  userId: string
): Promise<{
  signature_count: number;
  user_has_signed: boolean;
  meetup_thread_created: boolean;
}> {
  if (USE_FAKE_DATA) return {
    signature_count: 1,
    user_has_signed: true,
    meetup_thread_created: false
  };

  return apiPost(`/petitions/${petitionId}/sign`, { user_id: userId });
}

// Called by PetitionScreen Submit to Government button
export async function submitPetition(
  petitionId: string,
  userId: string
): Promise<{
  status: string;
  submitted_at: string;
  sent_to: string;
}> {
  if (USE_FAKE_DATA) return {
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    sent_to: 'smith@council.nyc.gov'
  };

  return apiPost(`/petitions/${petitionId}/submit`, { user_id: userId });
}

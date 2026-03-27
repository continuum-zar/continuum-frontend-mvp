import api from '@/lib/api';

export type EmailExistsResponse = {
  exists: boolean;
};

export async function checkEmailExists(email: string): Promise<EmailExistsResponse> {
  const response = await api.post<EmailExistsResponse>('/auth/email-exists', { email });
  return response.data;
}

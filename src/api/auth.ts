import api from '@/lib/api';

export type EmailExistsResponse = {
  exists: boolean;
};

export async function checkEmailExists(email: string): Promise<EmailExistsResponse> {
  const response = await api.post<EmailExistsResponse>('/auth/email-exists', { email });
  return response.data;
}

export type WaitlistSignupResponse = {
  message: string;
};

export async function postWaitlistSignup(email: string): Promise<WaitlistSignupResponse> {
  const response = await api.post<WaitlistSignupResponse>('/auth/waitlist', { email });
  return response.data;
}

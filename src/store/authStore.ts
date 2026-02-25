import { RegisterPayload } from '../types/user';

// This is a mockup of the auth store as requested.
// Since no state management library was found, we implement a simple functional approach
// or a placeholder that represents the registration action.

export const authStore = {
    register: async (payload: RegisterPayload) => {
        console.log('Registering user with payload:', payload);

        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, user: { ...payload, id: '123' } });
            }, 1500);
        });
    }
};

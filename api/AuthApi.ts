// API layer: wrapper around the app's REST endpoints. Useful for fast setup without the UI and for API tests.
// Login API: POST /api/auth/login  { email, password }  ->  200 + cookie "session_token"; 401 on wrong details (or 429 on lockout).
import { APIRequestContext, APIResponse } from '@playwright/test';

// Response of /api/auth/me (only the fields the tests use)
export interface UserProfile {
  id: string | number;
  name: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

export class AuthApi {
  constructor(private readonly request: APIRequestContext) {}

  // baseURL comes from playwright.config.ts
  login(email: string, password: string): Promise<APIResponse> {
    return this.request.post('/api/auth/login', { data: { email, password } });
  }

  me(): Promise<APIResponse> {
    return this.request.get('/api/auth/me');
  }
}

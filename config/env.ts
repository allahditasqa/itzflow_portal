// Ye file .env se settings (URL, email, password) parh kar ek jagah de deti hai.
// Is se code me password/URL hard-code nahi karna parta.
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export const ENV = {
  baseURL: process.env.BASE_URL ?? 'http://172.16.10.2:8300',
  workspaceId: process.env.WORKSPACE_ID ?? '1e214489-71f0-4ec2-ad5d-de3a0dd2c0d1',
  email: process.env.ITZ_EMAIL ?? '',
  password: process.env.ITZ_PASSWORD ?? '',
  // true tab hoga jab .env me email aur password dono bhare hon
  get hasCredentials(): boolean {
    return !!(this.email && this.password);
  },
};

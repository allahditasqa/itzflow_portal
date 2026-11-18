// This file reads the settings (URL, email, password) from .env and exposes them in one place.
// This way the password/URL never has to be hard-coded in the code.
import dotenv from 'dotenv';
import path from 'path';

// If TEST_ENV=staging is set, .env.staging is loaded first (dotenv does not overwrite an existing value), then .env
if (process.env.TEST_ENV) dotenv.config({ path: path.resolve(__dirname, '..', `.env.${process.env.TEST_ENV}`) });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export const ENV = {
  baseURL: process.env.BASE_URL ?? 'http://172.16.10.2:8300',
  workspaceId: process.env.WORKSPACE_ID ?? '1e214489-71f0-4ec2-ad5d-de3a0dd2c0d1',
  email: process.env.ITZ_EMAIL ?? '',
  password: process.env.ITZ_PASSWORD ?? '',
  // true only when both email and password are filled in .env
  get hasCredentials(): boolean {
    return !!(this.email && this.password);
  },
};

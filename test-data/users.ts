// Test data lives in a separate file to keep the tests clean.
import { ENV } from '../config/env';

export const validUser = { email: ENV.email, password: ENV.password };

// This email does not exist in the app (so no real account gets locked; the negative tests use it)
export const unknownUser = { email: 'no.such.user.qa@theitzon.com', password: 'WrongPass#123' };
export const invalidUser = unknownUser;
export const malformedEmail = 'not-an-email';

// Emails with an invalid format: the form must not be submitted at all
export const malformedEmails = [
  'plainaddress',
  '@theitzon.com',
  'user@',
  'user name@theitzon.com',
  'user@@theitzon.com',
];

// Security payloads (only with an unknown email; login must never succeed)
export const sqlInjection = "' OR '1'='1' --";
export const xssPayload = '<script>alert(1)</script>';

export const loginErrorText = 'Incorrect email or password';

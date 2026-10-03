'use client';

import { createAuthClient } from 'better-auth/react';

/** Cliente Better Auth (mesma origem — usa /api/auth). */
export const authClient = createAuthClient();

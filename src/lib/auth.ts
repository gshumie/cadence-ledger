import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export const DEFAULT_USER: AuthUser = {
  id: 'usr_cadence_default',
  email: 'alex.finance@cadenceledger.io',
  name: 'Alex Mercer (Lead Architect)',
};

/**
 * Extracts and verifies the authenticated user from the incoming request.
 * Supports:
 * 1. Supabase Bearer token (JWT in Authorization header)
 * 2. Custom header `x-user-id` and `x-user-email` (for testing / multi-user simulation)
 * 3. Default demo user session
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthUser> {
  let user: AuthUser = { ...DEFAULT_USER };

  const authHeader = req.headers.get('authorization');
  const customUserId = req.headers.get('x-user-id');
  const customUserEmail = req.headers.get('x-user-email');

  // 1. Check for Supabase JWT
  if (authHeader && authHeader.startsWith('Bearer ') && isSupabaseConfigured()) {
    const token = authHeader.split(' ')[1];
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        user = {
          id: data.user.id,
          email: data.user.email || DEFAULT_USER.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Cadence User',
        };
      }
    } catch (err) {
      console.warn('Supabase token verification failed, falling back to session user', err);
    }
  } else if (customUserId) {
    // 2. Custom user headers
    user = {
      id: customUserId,
      email: customUserEmail || `${customUserId}@cadenceledger.io`,
      name: customUserEmail ? customUserEmail.split('@')[0] : 'Cadence Member',
    };
  }

  // Ensure user exists in Prisma database if database is configured
  if (isDatabaseConfigured()) {
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          name: user.name,
        },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (dbError) {
      console.error('Failed to sync user in database:', dbError);
    }
  }

  return user;
}

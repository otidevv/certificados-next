import NextAuth, { CredentialsSignin } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { rateLimit, getClientIp } from './rate-limit';

class InvalidCredentialsError extends CredentialsSignin {
  code = 'invalid_credentials';
}

class AccountInactiveError extends CredentialsSignin {
  code = 'account_inactive';
}

class MissingFieldsError extends CredentialsSignin {
  code = 'missing_fields';
}

class RateLimitedError extends CredentialsSignin {
  code = 'rate_limited';
}

// Precomputed bcrypt hash of a random string — used to keep bcrypt.compare
// runtime roughly constant when the user is not found, closing a timing
// side-channel that would otherwise reveal email enumeration.
const DUMMY_BCRYPT_HASH = '$2b$12$CwTycUXWue0Thq9StjUM0uJ8qZ9sHBaJiGq9iYe3o8T1GqqYSv6sC';

const SESSION_REFRESH_MS = 5 * 60 * 1000;

function normalizeEmail(raw) {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const email = normalizeEmail(credentials?.email);
        const password = typeof credentials?.password === 'string' ? credentials.password : '';

        if (!email || !password) {
          throw new MissingFieldsError();
        }

        // Rate limit by (ip, email) tuple. Per-IP alone is too easy to share;
        // per-email alone lets attackers from any IP lock out a target.
        const ip = getClientIp(request);
        const rl = rateLimit(`login:${ip}:${email}`, 10, 15 * 60 * 1000);
        if (!rl.ok) {
          throw new RateLimitedError();
        }

        // Case-insensitive lookup: works with legacy mixed-case rows.
        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        });

        // Always run bcrypt.compare, even when the user does not exist,
        // so response time does not leak which emails are registered.
        const isPasswordValid = await bcrypt.compare(
          password,
          user?.password || DUMMY_BCRYPT_HASH,
        );

        if (!user || !isPasswordValid) {
          throw new InvalidCredentialsError();
        }

        if (user.status === 'INACTIVE') {
          throw new AccountInactiveError();
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          documentType: user.documentType,
          documentNumber: user.documentNumber,
          firstName: user.firstName,
          paternalSurname: user.paternalSurname,
          maternalSurname: user.maternalSurname,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in: hydrate the token from the authorized user
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.name = user.name;
        token.email = user.email;
        token.documentType = user.documentType;
        token.documentNumber = user.documentNumber;
        token.firstName = user.firstName;
        token.paternalSurname = user.paternalSurname;
        token.maternalSurname = user.maternalSurname;
        token.lastRefresh = Date.now();
        return token;
      }

      // Periodic re-validation against the DB so that role/status changes
      // (e.g. an admin deactivating a user) propagate within ~5 minutes.
      if (token?.id && (!token.lastRefresh || Date.now() - token.lastRefresh > SESSION_REFRESH_MS)) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            id: true, email: true, name: true, role: true, status: true,
            passwordChangedAt: true,
            documentType: true, documentNumber: true,
            firstName: true, paternalSurname: true, maternalSurname: true,
          },
        });

        if (!fresh || fresh.status !== 'ACTIVE') {
          // Invalidate the token so session callback returns no user id
          return {};
        }

        // Invalidate tokens issued before the password was last changed.
        // token.iat is seconds, passwordChangedAt is a Date.
        if (fresh.passwordChangedAt && token.iat) {
          const changedAtSec = Math.floor(new Date(fresh.passwordChangedAt).getTime() / 1000);
          if (token.iat < changedAtSec) {
            return {};
          }
        }

        token.role = fresh.role;
        token.status = fresh.status;
        token.name = fresh.name;
        token.email = fresh.email;
        token.documentType = fresh.documentType;
        token.documentNumber = fresh.documentNumber;
        token.firstName = fresh.firstName;
        token.paternalSurname = fresh.paternalSurname;
        token.maternalSurname = fresh.maternalSurname;
        token.lastRefresh = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (!token?.id) {
        // Token was invalidated (e.g. user deactivated). Leave session.user
        // without an id so auth guards treat the request as unauthenticated.
        if (session.user) session.user.id = undefined;
        return session;
      }
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.status = token.status;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.documentType = token.documentType;
      session.user.documentNumber = token.documentNumber;
      session.user.firstName = token.firstName;
      session.user.paternalSurname = token.paternalSurname;
      session.user.maternalSurname = token.maternalSurname;
      return session;
    },
  },
});

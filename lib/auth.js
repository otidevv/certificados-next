import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Contraseña incorrecta');
        }

        if (user.status === 'INACTIVE') {
          throw new Error('Tu cuenta ha sido desactivada');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.documentType = user.documentType;
        token.documentNumber = user.documentNumber;
        token.firstName = user.firstName;
        token.paternalSurname = user.paternalSurname;
        token.maternalSurname = user.maternalSurname;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.documentType = token.documentType;
        session.user.documentNumber = token.documentNumber;
        session.user.firstName = token.firstName;
        session.user.paternalSurname = token.paternalSurname;
        session.user.maternalSurname = token.maternalSurname;
      }
      return session;
    },
  },
});

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// NextAuth configuration
export const authOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Implementar autenticação aqui
        return null;
      },
    }),
  ],
};

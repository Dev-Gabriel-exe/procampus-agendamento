// ============================================================
// ARQUIVO: lib/auth.ts
// CAMINHO: procampus-agendamento/lib/auth.ts
// ============================================================
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuário', type: 'text' },
        password: { label: 'Senha',   type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const secretary = await prisma.secretary.findUnique({
          where: { username: credentials.username as string },
        })
        if (!secretary) return null
        const isValid = await bcrypt.compare(credentials.password as string, secretary.password)
        if (!isValid) return null
        // ✅ inclui role no objeto retornado
        return {
          id:   secretary.id,
          name: secretary.username,
          email: `${secretary.username}@procampus.com.br`,
          role: secretary.role,
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/secretaria/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as any).role ?? 'geral'
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id   = token.id as string
        ;(session.user as any).role = token.role as string
      }
      return session
    },
  },
})
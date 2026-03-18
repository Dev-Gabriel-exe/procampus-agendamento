import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const isSecretariaRoute = request.nextUrl.pathname.startsWith('/secretaria')
  const isLoginPage = request.nextUrl.pathname === '/secretaria/login'

  if (isSecretariaRoute && !isLoginPage && !token) {
    return NextResponse.redirect(new URL('/secretaria/login', request.url))
  }
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/secretaria', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/secretaria/:path*'] }
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Protege /secretaria/* - verificar se está autenticado
  return NextResponse.next();
}

export const config = {
  matcher: ['/secretaria/:path*'],
};

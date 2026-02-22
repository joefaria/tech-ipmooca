import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirecionar /monitor (rota antiga) para /professor
  if (pathname.startsWith('/monitor')) {
    return NextResponse.redirect(new URL('/professor', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/monitor/:path*'],
};

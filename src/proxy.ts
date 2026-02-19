import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname.startsWith('/monitor')) {
    const key = searchParams.get('key');
    if (key !== process.env.MONITOR_PASSWORD) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/monitor/:path*'],
};

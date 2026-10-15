import { NextResponse } from 'next/server';
import { COMPONENT } from '@/lib/manifest';

/** Public by design (served at /.well-known/fox-component.json). Static record only — never add live or owner data here. */
export function GET() {
  return NextResponse.json(
    { ...COMPONENT, deployment: { commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null, environment: process.env.VERCEL_ENV ?? 'local' } },
    { headers: { 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' } },
  );
}

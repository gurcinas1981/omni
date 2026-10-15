import { NextResponse } from 'next/server';
import { supabaseConfigured } from '@/lib/supabase/env';

/** Public, non-sensitive health signal for ORBIT to poll. Reports configuration, never data. */
export function GET() {
  return NextResponse.json({
    service: 'omnisynapse',
    version: '1.0.0',
    status: 'ok',
    auth_configured: supabaseConfigured(),
    integrations: { orbit: 'UNCONNECTED', nexus: 'UNCONNECTED' },
    observed_at: new Date().toISOString(),
  });
}

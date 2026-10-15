import { NextResponse } from 'next/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import { orbitConfigured } from '@/lib/integrations/orbit';
import { nexusConfigured } from '@/lib/integrations/nexus';

/** Public, non-sensitive health signal for ORBIT to poll. Reports configuration, never data. */
export function GET() {
  return NextResponse.json({
    service: 'omnisynapse',
    version: '1.1.0',
    status: 'ok',
    auth_configured: supabaseConfigured(),
    // Configuration only — live connection state is owner-only data and is never exposed here.
    integrations: { orbit: orbitConfigured() ? 'CONFIGURED' : 'UNCONFIGURED', nexus: nexusConfigured() ? 'CONFIGURED' : 'UNCONFIGURED' },
    observed_at: new Date().toISOString(),
  });
}

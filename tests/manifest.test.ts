import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/manifest/route';
import { COMPONENT } from '@/lib/manifest';
import { ORBIT_SITE_TO_SYSTEM, VERCEL_PROJECT_TO_SYSTEM } from '@/lib/integrations/orbitMap';
import { readFileSync } from 'node:fs';

describe('fox.ecosystem.component.v1 manifest', () => {
  it('serves a valid, public, read-only record', async () => {
    const res = GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schema).toBe('fox.ecosystem.component.v1');
    expect(body.id).toBe('fox.omnisynapse');
    expect(new URL(body.urls.production).hostname).toBe('omni.foxintelligence.co.uk');
    expect(body.interfaces.health).toBeTruthy();
    expect(body.interfaces.manifest).toBeTruthy();
    expect(body.capabilities.every((c: { id?: string }) => !!c.id)).toBe(true);
    expect(body.status).toBeUndefined(); // no self-reported connection status
  });
  it('carries no credential-shaped values', () => {
    expect(JSON.stringify(COMPONENT)).not.toMatch(/sk-[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{15,}\.|gh[pousr]_[A-Za-z0-9]{30,}/);
  });
  it('is reachable at the well-known path', () => {
    const cfg = readFileSync('next.config.mjs', 'utf8');
    expect(cfg).toContain("source: '/.well-known/fox-component.json', destination: '/api/manifest'");
  });
  it('OMNI is mapped from ORBIT site and Vercel project ids', () => {
    expect(ORBIT_SITE_TO_SYSTEM.omni).toBe('fox-omnisynapse');
    expect(VERCEL_PROJECT_TO_SYSTEM.omni).toBe('fox-omnisynapse');
  });
});

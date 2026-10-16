-- Register FOX GIS (gis.foxatlas.co.uk, Vercel fox-gis): the RustGIS spatial engine behind Land IQ,
-- Land Search and Planning RADAR. UNCONNECTED until an adapter verifies it — ORBIT observations of its
-- health arrive as orbit_events (orbitMap: gis / fox-gis → fox-gis), never as a claimed connection.
insert into public.systems (id, name, reference_url, category, description, connection_status) values
  ('fox-gis', 'FOX GIS', 'https://gis.foxatlas.co.uk/', 'spatial-engine', 'RustGIS geoprocessing engine (buffer, clip, overlay, measure) called by the land platforms through NEXUS', 'UNCONNECTED')
on conflict (id) do nothing;
-- Rollback: delete from public.systems where id = 'fox-gis';

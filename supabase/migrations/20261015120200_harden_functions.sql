-- Harden SECURITY DEFINER trigger functions (Supabase advisor 0028/0029): no direct RPC execution.
-- Triggers still fire; only direct /rest/v1/rpc calls are blocked.
-- Note: public.is_owner()/is_viewer() remain executable by `authenticated` because RLS policies call
-- them; they only reveal whether the *caller* is an owner. Optional future hardening: move them to a
-- non-exposed `private` schema (requires recreating policies — schedule as a reviewed migration).
revoke execute on function public.audit_generic() from public, anon, authenticated;
revoke execute on function public.enforce_recommendation_transition() from public, anon, authenticated;
revoke execute on function public.audit_immutable() from public, anon, authenticated;

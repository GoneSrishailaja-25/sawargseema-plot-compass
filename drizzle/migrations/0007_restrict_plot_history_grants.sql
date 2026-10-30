REVOKE ALL ON public.plot_history FROM anon, authenticated;
GRANT SELECT ON public.plot_history TO authenticated;
GRANT ALL ON public.plot_history TO service_role;
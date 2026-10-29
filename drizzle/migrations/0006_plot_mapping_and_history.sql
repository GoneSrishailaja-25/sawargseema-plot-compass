ALTER TABLE public.plots ADD COLUMN latitude double precision, ADD COLUMN longitude double precision, ADD COLUMN information_verified boolean NOT NULL DEFAULT false, ADD COLUMN verified_at timestamptz, ADD COLUMN verified_by uuid;
ALTER TABLE public.plots ADD CONSTRAINT plots_coordinates_valid CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180));
CREATE TABLE public.plot_history (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), plot_id uuid NOT NULL, plot_number integer NOT NULL, action text NOT NULL, changed_by uuid, changed_at timestamptz NOT NULL DEFAULT now(), before_data jsonb, after_data jsonb);
GRANT SELECT ON public.plot_history TO authenticated;
GRANT ALL ON public.plot_history TO service_role;
ALTER TABLE public.plot_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY history_admin_read ON public.plot_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE FUNCTION public.plot_information_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_OP='INSERT' THEN NEW.information_verified:=false; NEW.verified_at:=NULL; NEW.verified_by:=NULL;
 ELSIF ROW(NEW.plot_number,NEW.phase_id,NEW.size_sqyd,NEW.dimensions,NEW.location_note,NEW.price_per_sqyd,NEW.latitude,NEW.longitude,NEW.amenities,NEW.facing) IS DISTINCT FROM ROW(OLD.plot_number,OLD.phase_id,OLD.size_sqyd,OLD.dimensions,OLD.location_note,OLD.price_per_sqyd,OLD.latitude,OLD.longitude,OLD.amenities,OLD.facing) THEN NEW.information_verified:=false; NEW.verified_at:=NULL; NEW.verified_by:=NULL;
 ELSIF NEW.information_verified THEN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin authorization required'; END IF;
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL OR btrim(NEW.dimensions)='' OR btrim(NEW.location_note)='' OR NEW.size_sqyd<=0 OR NEW.price_per_sqyd<=0 THEN RAISE EXCEPTION 'Complete area, dimensions, location, coordinates and price before verification'; END IF;
  IF NOT OLD.information_verified THEN NEW.verified_at:=now(); NEW.verified_by:=auth.uid(); ELSE NEW.verified_at:=OLD.verified_at; NEW.verified_by:=OLD.verified_by; END IF;
 ELSE NEW.verified_at:=NULL; NEW.verified_by:=NULL;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER plot_information_guard BEFORE INSERT OR UPDATE ON public.plots FOR EACH ROW EXECUTE FUNCTION public.plot_information_guard();
CREATE FUNCTION public.record_plot_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='UPDATE' AND (to_jsonb(OLD)-'updated_at')=(to_jsonb(NEW)-'updated_at') THEN RETURN NEW; END IF;
 INSERT INTO public.plot_history(plot_id,plot_number,action,changed_by,before_data,after_data) VALUES(CASE WHEN TG_OP='DELETE' THEN OLD.id ELSE NEW.id END,CASE WHEN TG_OP='DELETE' THEN OLD.plot_number ELSE NEW.plot_number END,TG_OP,auth.uid(),CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END,CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END);
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.record_plot_history() FROM PUBLIC;
CREATE TRIGGER record_plot_history AFTER INSERT OR UPDATE OR DELETE ON public.plots FOR EACH ROW EXECUTE FUNCTION public.record_plot_history();
CREATE OR REPLACE FUNCTION public.review_ownership_document(_document uuid, _status text, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE d public.ownership_documents; admin_reviewer boolean;
BEGIN
 admin_reviewer := public.has_role(auth.uid(),'admin');
 IF auth.uid() IS NULL OR NOT (admin_reviewer OR public.has_role(auth.uid(),'officer')) THEN
  RAISE EXCEPTION 'Only authorized admins or officers may review documents';
 END IF;
 IF _status IS NULL OR _status NOT IN ('Pending','Verified','Rejected') OR _note IS NULL OR length(_note)>2000
 OR (_status='Rejected' AND length(btrim(_note))=0)
 OR (admin_reviewer AND _status='Verified' AND length(btrim(_note))=0) THEN
  RAISE EXCEPTION 'Invalid review or missing decision reason';
 END IF;
 SELECT * INTO d FROM public.ownership_documents WHERE id=_document FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Document not found'; END IF;
 UPDATE public.ownership_documents SET status=_status, review_note=btrim(_note), reviewed_by=auth.uid(), reviewed_at=now() WHERE id=d.id;
 INSERT INTO public.ownership_reviews(document_id,case_id,status,note,officer_id) VALUES(d.id,d.case_id,_status,btrim(_note),auth.uid());
END $function$;
REVOKE ALL ON FUNCTION public.review_ownership_document(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_ownership_document(uuid,text,text) TO authenticated;
COMMENT ON FUNCTION public.review_ownership_document(uuid,text,text) IS 'Explicit admin or officer review only; admin approval and all rejection decisions require reasons. Records reviewer identity in the existing audit trail.';
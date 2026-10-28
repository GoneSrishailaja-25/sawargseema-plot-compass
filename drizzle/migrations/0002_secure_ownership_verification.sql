CREATE TABLE public.ownership_cases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), plot_id uuid NOT NULL UNIQUE REFERENCES public.plots(id), customer_id uuid NOT NULL REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ownership_cases TO authenticated;
GRANT ALL ON public.ownership_cases TO service_role;
ALTER TABLE public.ownership_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY cases_read ON public.ownership_cases FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));
CREATE POLICY cases_create ON public.ownership_cases FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.can_read_ownership(_case uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS (SELECT 1 FROM public.ownership_cases WHERE id=_case AND (customer_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'))) $$;
CREATE TABLE public.ownership_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES public.ownership_cases(id), category text NOT NULL CHECK(category IN ('ownership','sale_deed','approval')), file_name text NOT NULL CHECK(length(file_name) BETWEEN 1 AND 200), storage_path text NOT NULL UNIQUE, status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Verified','Rejected')), review_note text NOT NULL DEFAULT '', uploaded_by uuid NOT NULL DEFAULT auth.uid(), reviewed_by uuid, reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ownership_documents TO authenticated;
GRANT ALL ON public.ownership_documents TO service_role;
ALTER TABLE public.ownership_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_read ON public.ownership_documents FOR SELECT TO authenticated USING(public.can_read_ownership(case_id));
CREATE POLICY documents_upload ON public.ownership_documents FOR INSERT TO authenticated WITH CHECK(public.has_role(auth.uid(),'admin') AND uploaded_by=auth.uid() AND status='Pending' AND reviewed_by IS NULL AND reviewed_at IS NULL AND review_note='');
CREATE TABLE public.ownership_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES public.ownership_documents(id), case_id uuid NOT NULL REFERENCES public.ownership_cases(id), status text NOT NULL CHECK(status IN ('Pending','Verified','Rejected')), note text NOT NULL, officer_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ownership_reviews TO authenticated;
GRANT ALL ON public.ownership_reviews TO service_role;
ALTER TABLE public.ownership_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_read ON public.ownership_reviews FOR SELECT TO authenticated USING(public.can_read_ownership(case_id));
CREATE TABLE public.ownership_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, case_id uuid NOT NULL REFERENCES public.ownership_cases(id), message text NOT NULL, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ownership_notifications TO authenticated;
GRANT ALL ON public.ownership_notifications TO service_role;
ALTER TABLE public.ownership_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_read ON public.ownership_notifications FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.ownership_questions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES public.ownership_cases(id), user_id uuid NOT NULL DEFAULT auth.uid(), question text NOT NULL CHECK(length(trim(question)) BETWEEN 1 AND 1000), reply text NOT NULL DEFAULT '' CHECK(length(reply)<=2000), replied_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ownership_questions TO authenticated;
GRANT ALL ON public.ownership_questions TO service_role;
ALTER TABLE public.ownership_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY questions_read ON public.ownership_questions FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY questions_create ON public.ownership_questions FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND reply='' AND replied_at IS NULL AND EXISTS(SELECT 1 FROM public.ownership_cases c WHERE c.id=case_id AND c.customer_id=auth.uid()));
CREATE FUNCTION public.validate_ownership_document() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NEW.storage_path <> NEW.case_id::text || '/' || NEW.id::text || '/' || NEW.file_name THEN RAISE EXCEPTION 'Invalid document path'; END IF;
 IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='ownership-documents' AND name=NEW.storage_path) THEN RAISE EXCEPTION 'Upload file before saving document'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER ownership_document_validate BEFORE INSERT ON public.ownership_documents FOR EACH ROW EXECUTE FUNCTION public.validate_ownership_document();
CREATE FUNCTION public.ownership_notify() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE recipient uuid; notice text; BEGIN
 IF TG_TABLE_NAME='ownership_cases' THEN recipient:=NEW.customer_id; notice:='Ownership verification opened. Missing documents: ownership document, sale deed, approval record.';
 ELSE SELECT customer_id INTO recipient FROM public.ownership_cases WHERE id=NEW.case_id; notice:= CASE WHEN TG_OP='INSERT' THEN 'Document uploaded for review: '||NEW.file_name ELSE NEW.file_name||': '||NEW.status||CASE WHEN NEW.review_note<>'' THEN ' — '||NEW.review_note ELSE '' END END; END IF;
 INSERT INTO public.ownership_notifications(user_id,case_id,message) VALUES(recipient,CASE WHEN TG_TABLE_NAME='ownership_cases' THEN NEW.id ELSE NEW.case_id END,notice); RETURN NEW; END $$;
CREATE TRIGGER ownership_case_notice AFTER INSERT ON public.ownership_cases FOR EACH ROW EXECUTE FUNCTION public.ownership_notify();
CREATE TRIGGER ownership_document_notice AFTER INSERT OR UPDATE ON public.ownership_documents FOR EACH ROW EXECUTE FUNCTION public.ownership_notify();
CREATE FUNCTION public.review_ownership_document(_document uuid, _status text, _note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE d public.ownership_documents; BEGIN
 IF NOT public.has_role(auth.uid(),'officer') THEN RAISE EXCEPTION 'Only authorized officers may review documents'; END IF;
 IF _status NOT IN ('Pending','Verified','Rejected') OR _status IS NULL OR _note IS NULL OR length(_note)>2000 OR (_status='Rejected' AND length(trim(_note))=0) THEN RAISE EXCEPTION 'Invalid review or missing rejection reason'; END IF;
 SELECT * INTO d FROM public.ownership_documents WHERE id=_document FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Document not found'; END IF;
 UPDATE public.ownership_documents SET status=_status, review_note=trim(_note),reviewed_by=auth.uid(),reviewed_at=now() WHERE id=d.id;
 INSERT INTO public.ownership_reviews(document_id,case_id,status,note,officer_id) VALUES(d.id,d.case_id,_status,trim(_note),auth.uid()); END $$;
REVOKE ALL ON FUNCTION public.review_ownership_document(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_ownership_document(uuid,text,text) TO authenticated;
CREATE FUNCTION public.set_ownership_officer(_user uuid, _enabled boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=_user) THEN RAISE EXCEPTION 'Account not found'; END IF;
 IF _enabled THEN INSERT INTO public.user_roles(user_id,role) VALUES(_user,'officer') ON CONFLICT(user_id,role) DO NOTHING; ELSE DELETE FROM public.user_roles WHERE user_id=_user AND role='officer'; END IF; END $$;
REVOKE ALL ON FUNCTION public.set_ownership_officer(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_ownership_officer(uuid,boolean) TO authenticated;
CREATE FUNCTION public.reply_ownership_question(_question uuid,_reply text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE q public.ownership_questions; BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF _reply IS NULL OR length(trim(_reply)) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Reply must be 1–2000 characters'; END IF;
 UPDATE public.ownership_questions SET reply=trim(_reply),replied_at=now() WHERE id=_question RETURNING * INTO q;
 IF NOT FOUND THEN RAISE EXCEPTION 'Question not found'; END IF;
 INSERT INTO public.ownership_notifications(user_id,case_id,message) VALUES(q.user_id,q.case_id,'Admin replied: '||trim(_reply)); END $$;
REVOKE ALL ON FUNCTION public.reply_ownership_question(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reply_ownership_question(uuid,text) TO authenticated;
CREATE FUNCTION public.mark_ownership_notices_read() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ UPDATE public.ownership_notifications SET read_at=now() WHERE user_id=auth.uid() AND read_at IS NULL $$;
REVOKE ALL ON FUNCTION public.mark_ownership_notices_read() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mark_ownership_notices_read() TO authenticated;
CREATE POLICY ownership_file_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='ownership-documents' AND public.has_role(auth.uid(),'admin') AND EXISTS(SELECT 1 FROM public.ownership_cases c WHERE c.id::text=(storage.foldername(name))[1]));
CREATE POLICY ownership_file_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='ownership-documents' AND EXISTS(SELECT 1 FROM public.ownership_documents d WHERE d.storage_path=name AND public.can_read_ownership(d.case_id)));
CREATE POLICY ownership_orphan_cleanup ON storage.objects FOR DELETE TO authenticated USING(bucket_id='ownership-documents' AND public.has_role(auth.uid(),'admin') AND NOT EXISTS(SELECT 1 FROM public.ownership_documents d WHERE d.storage_path=name));
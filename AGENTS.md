<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Auth uses mobile + password; mobile maps to a synthetic email via `mobileToEmail` in src/lib/data.ts (auto-confirm on) — real email is optional profile data.
- First registered account becomes admin (handle_new_user trigger); roles live only in public.user_roles, checked via has_role in RLS.
- Plot data is read client-side via shared queryOptions in src/lib/data.ts; realtime on `plots` in __root invalidates the cache so charts stay live.
- Ownership files are private and case-scoped to assigned customers, admins and officers; RLS and explicit database review functions enforce permissions, and only officer reviews can change document status.
- Ownership notifications are persistent in-app notices; customer ownership queries are keyed by identity and cleared on sign-out to avoid cross-account cache exposure.

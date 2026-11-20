alter table public.search_activity
  add constraint search_activity_term_has_no_contact_details
  check (
    term !~ '@'
    and char_length(regexp_replace(term, '[^0-9]', '', 'g')) < 8
  );

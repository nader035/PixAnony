begin;

create or replace function private.notify_received_artwork()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.receiver_id is not null and new.receiver_id <> new.user_id then
    insert into public.notifications (user_id, actor_id, artwork_id, type)
    values (
      new.receiver_id,
      case when new.is_anonymous then null else new.user_id end,
      new.id,
      'received_pixel'
    );
  end if;

  return new;
end;
$$;

revoke all on function private.notify_received_artwork() from public, anon, authenticated;

drop trigger if exists notify_on_received_artwork on public.artworks;
create trigger notify_on_received_artwork
  after insert on public.artworks
  for each row execute function private.notify_received_artwork();

commit;

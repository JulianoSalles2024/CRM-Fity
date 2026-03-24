-- Restaura a função accept_invite que foi perdida
drop function if exists public.accept_invite(uuid) cascade;

create or replace function public.accept_invite(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite  invites%rowtype;
  v_uid     uuid := auth.uid();
begin
  select * into v_invite from public.invites where id = invite_id;

  if not found then
    raise exception 'Convite não encontrado.' using errcode = 'P0002';
  end if;
  if v_invite.used_at is not null then
    raise exception 'Este convite já foi utilizado.' using errcode = 'P0003';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'Este convite expirou.' using errcode = 'P0004';
  end if;

  update public.profiles
  set company_id = v_invite.company_id,
      role       = v_invite.role
  where id = v_uid;

  update public.invites
  set used_at = now()
  where id = invite_id;
end;
$$;

grant execute on function public.accept_invite(uuid) to authenticated;

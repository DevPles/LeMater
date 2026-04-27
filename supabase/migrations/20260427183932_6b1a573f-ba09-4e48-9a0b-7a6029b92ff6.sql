
-- Função pública que retorna o snapshot do cartão da gestante
create or replace function public.get_cartao_publico(_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile jsonb;
  v_medicoes jsonb;
  v_vacinas jsonb;
  v_exames jsonb;
begin
  select to_jsonb(p) - 'cpf' into v_profile
  from public.profiles p
  where p.user_id = _user_id
  limit 1;

  if v_profile is null then
    return null;
  end if;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.data_medicao), '[]'::jsonb) into v_medicoes
  from public.clinical_measurements m
  where m.gestante_id = _user_id;

  select coalesce(jsonb_agg(to_jsonb(v) order by v.data_aplicacao desc), '[]'::jsonb) into v_vacinas
  from public.vaccinations v
  where v.gestante_id = _user_id;

  select coalesce(jsonb_agg(to_jsonb(e) order by e.data_exame desc), '[]'::jsonb) into v_exames
  from public.exam_results e
  where e.gestante_id = _user_id;

  return jsonb_build_object(
    'profile', v_profile,
    'medicoes', v_medicoes,
    'vacinas', v_vacinas,
    'exames', v_exames
  );
end;
$$;

grant execute on function public.get_cartao_publico(uuid) to anon, authenticated;

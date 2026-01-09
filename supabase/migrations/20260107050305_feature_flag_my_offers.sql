-- supabase/migrations/YYYYMMDDHHMMSS_seed_feature_flags_my_offers.sql
begin;

insert into control_panel.feature_flags (
  workspace,
  key,
  label,
  description,
  enabled,
  created_at,
  updated_at
)
values
  (
    'my-offers',
    'my_offers_enabled',
    'My Offers',
    'Activa el workspace My Offers',
    true,
    now(),
    now()
  ),
  (
    'my-offers',
    'my_offers_new_ui',
    'Nueva UI de ofertas',
    'Habilita la nueva interfaz del módulo de ofertas',
    false,
    now(),
    now()
  )
on conflict (workspace, key) do nothing;

commit;

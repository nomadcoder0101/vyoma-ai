create unique index if not exists users_auth_provider_user_id_idx
on users(auth_provider, auth_provider_user_id)
where auth_provider_user_id is not null;

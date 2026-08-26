function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function normalizeBootstrapIdentifier(value) {
  const identifier = String(value || "").trim().toLowerCase();

  if (!identifier || identifier.length > 320 || !identifier.includes("@")) {
    throw new Error("admin_bootstrap_identifier_invalid");
  }

  return identifier;
}

export function assertBootstrapPasswordPolicy(value) {
  const password = String(value || "");

  if (password.length < 16) {
    throw new Error("admin_bootstrap_password_too_short");
  }

  if (!/[a-z]/.test(password)
      || !/[A-Z]/.test(password)
      || !/[0-9]/.test(password)
      || !/[^A-Za-z0-9]/.test(password)) {
    throw new Error("admin_bootstrap_password_policy_failed");
  }

  return password;
}

export function buildFirstAdminBootstrapSql({
  identifier,
  credential,
} = {}) {
  const normalizedIdentifier = normalizeBootstrapIdentifier(identifier);

  if (!credential
      || credential.algorithm !== "scrypt"
      || !credential.salt
      || !credential.hash
      || !Number.isInteger(credential.keyLength)
      || credential.keyLength < 16) {
    throw new Error("admin_bootstrap_credential_invalid");
  }

  const capabilities = JSON.stringify([]);

  return `-- ONE-TIME RODA FESTA ADMIN BOOTSTRAP
-- Contains credential verification material. Do not commit, share or archive this file.
-- Execute only in the confirmed Roda Festa Supabase project, then delete this file.

do $$
begin
  if exists (select 1 from public.admin_users limit 1) then
    raise exception 'admin_bootstrap_refused_existing_admin';
  end if;

  insert into public.admin_users (
    identifier,
    role,
    capabilities,
    active,
    credential_algorithm,
    credential_salt,
    credential_hash,
    credential_key_length,
    metadata
  )
  values (
    ${sqlLiteral(normalizedIdentifier)},
    'OWNER',
    ${sqlLiteral(capabilities)}::jsonb,
    true,
    ${sqlLiteral(credential.algorithm)},
    ${sqlLiteral(credential.salt)},
    ${sqlLiteral(credential.hash)},
    ${credential.keyLength},
    '{"provisionedBy":"one-time-bootstrap"}'::jsonb
  );
end
$$;
`;
}

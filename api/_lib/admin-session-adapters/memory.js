export function createMemoryAdminSessionAdapter({
  allowInProduction = false,
  env = process.env,
  idFactory = (() => {
    let sequence = 0;
    return () => `admin-session-${++sequence}`;
  })(),
} = {}) {
  if (env.NODE_ENV === "production" && !allowInProduction) {
    throw new Error("memory_admin_session_adapter_forbidden_in_production");
  }

  const sessions = new Map();

  return Object.freeze({
    async create(input) {
      const record = {
        id: idFactory(),
        ...structuredClone(input),
        version: 1,
      };
      sessions.set(record.id, record);
      return structuredClone(record);
    },

    async findByTokenHash(tokenHash) {
      for (const record of sessions.values()) {
        if (record.tokenHash === tokenHash) return structuredClone(record);
      }
      return null;
    },

    async revokeById(sessionId, revokedAt) {
      const record = sessions.get(sessionId);
      if (!record) return false;
      if (record.revokedAt) return true;

      record.revokedAt = revokedAt;
      record.version += 1;
      return true;
    },

    async replaceToken({
      sessionId,
      expectedTokenHash,
      nextTokenHash,
      rotatedAt,
    }) {
      const record = sessions.get(sessionId);
      if (!record || record.tokenHash !== expectedTokenHash || record.revokedAt) return false;

      record.tokenHash = nextTokenHash;
      record.rotatedAt = rotatedAt;
      record.version += 1;
      return true;
    },

    __unsafeInspectForTests(sessionId) {
      const record = sessions.get(sessionId);
      return record ? structuredClone(record) : null;
    },
  });
}

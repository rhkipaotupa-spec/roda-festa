function clone(value) {
  return value == null ? value : structuredClone(value);
}

export function createMemoryPlanningSessionAdapter() {
  const records = new Map();
  const requestIndex = new Map();

  return {
    async create({ id, clientRequestId, tokenHash, source = "planner-web", inputSnapshot, recommendationSnapshot }) {
      const existingId = requestIndex.get(clientRequestId);
      if (existingId) {
        const existing = records.get(existingId);
        if (existing.anonymous_session_token_hash !== tokenHash) throw new Error("planning_session_idempotency_conflict");
        return { created: false, session: clone(existing) };
      }

      const now = new Date().toISOString();
      const record = {
        id,
        client_request_id: clientRequestId,
        anonymous_session_token_hash: tokenHash,
        source,
        status: "ACTIVE",
        version: 1,
        input_snapshot: clone(inputSnapshot),
        recommendation_snapshot: clone(recommendationSnapshot),
        planning_changes: [],
        final_proposal_snapshot: null,
        client_name: null,
        phone: null,
        email: null,
        created_at: now,
        last_activity_at: now,
        finalized_at: null,
      };
      records.set(id, record);
      requestIndex.set(clientRequestId, id);
      return { created: true, session: clone(record) };
    },

    async getOwned({ sessionId, tokenHash }) {
      const record = records.get(sessionId);
      if (!record || record.anonymous_session_token_hash !== tokenHash) return null;
      return clone(record);
    },

    async finalize({ sessionId, tokenHash, finalSnapshot, changes, expectedVersion }) {
      const record = records.get(sessionId);
      if (!record || record.anonymous_session_token_hash !== tokenHash) throw new Error("planning_session_not_found");
      if (record.final_proposal_snapshot) {
        if (record.final_proposal_snapshot.code === finalSnapshot.code) return { finalized: false, session: clone(record), idempotent: true };
        throw new Error("planning_session_already_finalized");
      }
      if (Number(record.version) !== Number(expectedVersion)) throw new Error("planning_session_concurrent_update");
      record.status = "FINALIZED";
      record.final_proposal_snapshot = clone(finalSnapshot);
      record.planning_changes = clone(changes || []);
      record.version += 1;
      record.last_activity_at = new Date().toISOString();
      record.finalized_at = record.last_activity_at;
      return { finalized: true, session: clone(record), idempotent: false };
    },

    async touchContact({ sessionId, tokenHash, clientName, phone, email = null }) {
      const record = records.get(sessionId);
      if (!record || record.anonymous_session_token_hash !== tokenHash) throw new Error("planning_session_not_found");
      record.client_name = clientName;
      record.phone = phone;
      record.email = email;
      record.last_activity_at = new Date().toISOString();
      return clone(record);
    },

    _unsafeSizeForTests() { return records.size; },
  };
}

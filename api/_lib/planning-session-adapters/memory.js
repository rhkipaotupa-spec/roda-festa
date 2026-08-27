function clone(value) {
  return value == null ? value : structuredClone(value);
}

export function createMemoryPlanningSessionAdapter() {
  const records = new Map();
  const requestIndex = new Map();
  let proposalSequenceDate = "";
  let proposalSequence = 0;

  function allocateProposalCode() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo", year: "2-digit", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const datePart = `${byType.year}${byType.month}${byType.day}`;
    if (proposalSequenceDate !== datePart) {
      proposalSequenceDate = datePart;
      proposalSequence = 0;
    }
    proposalSequence += 1;
    return `RF-${datePart}-${String(proposalSequence).padStart(5, "0")}`;
  }

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

    async appendChanges({ sessionId, tokenHash, changes, expectedVersion }) {
      const record = records.get(sessionId);
      if (!record || record.anonymous_session_token_hash !== tokenHash) throw new Error("planning_session_not_found");
      if (record.final_proposal_snapshot) throw new Error("planning_session_already_finalized");
      if (Number(record.version) !== Number(expectedVersion)) throw new Error("planning_session_concurrent_update");
      const accepted = clone(changes || []);
      record.planning_changes.push(...accepted);
      record.version += 1;
      record.last_activity_at = new Date().toISOString();
      return { appended: accepted.length, session: clone(record) };
    },

    async finalize({ sessionId, tokenHash, finalSnapshot, expectedVersion }) {
      const record = records.get(sessionId);
      if (!record || record.anonymous_session_token_hash !== tokenHash) throw new Error("planning_session_not_found");
      const suppliedCode = String(finalSnapshot?.code || "");
      if (record.final_proposal_snapshot) {
        if (!suppliedCode || record.final_proposal_snapshot.code === suppliedCode) return { finalized: false, session: clone(record), idempotent: true };
        throw new Error("planning_session_already_finalized");
      }
      if (Number(record.version) !== Number(expectedVersion)) throw new Error("planning_session_concurrent_update");
      const proposalCode = suppliedCode || allocateProposalCode();
      record.status = "FINALIZED";
      record.final_proposal_snapshot = clone({ ...finalSnapshot, code: proposalCode });
      // planning_changes is append-only journey evidence and must not be overwritten here.
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

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 120),
    password_salt BLOB NOT NULL CHECK(length(password_salt) >= 16),
    password_hash BLOB NOT NULL CHECK(length(password_hash) = 32),
    password_iterations INTEGER NOT NULL CHECK(password_iterations >= 210000),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    disabled_at TEXT
) STRICT;

CREATE TABLE IF NOT EXISTS sessions (
    token_hash BLOB PRIMARY KEY CHECK(length(token_hash) = 32),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    user_agent TEXT,
    ip_hint TEXT,
    revoked_at TEXT
) STRICT;
CREATE INDEX IF NOT EXISTS idx_sessions_user_expiry ON sessions(user_id, expires_at);

CREATE TABLE IF NOT EXISTS child_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
    birth_date TEXT,
    sex TEXT CHECK(sex IS NULL OR sex IN ('female','male','unspecified')),
    allergies TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_children_user ON child_profiles(user_id, created_at);

CREATE TABLE IF NOT EXISTS consents (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id TEXT REFERENCES child_profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK(consent_type IN ('data_processing','telegram_delivery','agent_assistance')),
    granted INTEGER NOT NULL CHECK(granted IN (0,1)),
    granted_at TEXT,
    revoked_at TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, child_id, consent_type)
) STRICT;

CREATE TABLE IF NOT EXISTS channel_identities (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK(provider IN ('telegram')),
    provider_user_id TEXT NOT NULL,
    provider_chat_id TEXT NOT NULL,
    display_name TEXT,
    linked_at TEXT NOT NULL,
    unlinked_at TEXT,
    UNIQUE(provider, provider_user_id),
    UNIQUE(provider, provider_chat_id)
) STRICT;

CREATE TABLE IF NOT EXISTS channel_link_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash BLOB NOT NULL UNIQUE CHECK(length(code_hash) = 32),
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    consumed_at TEXT,
    consumed_by_identity_id INTEGER REFERENCES channel_identities(id),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count >= 0)
) STRICT;
CREATE INDEX IF NOT EXISTS idx_link_codes_user_expiry ON channel_link_codes(user_id, expires_at);

CREATE TABLE IF NOT EXISTS measurements (
    id TEXT PRIMARY KEY,
    child_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
    measured_at TEXT NOT NULL,
    weight_kg REAL CHECK(weight_kg IS NULL OR (weight_kg > 0 AND weight_kg <= 300)),
    height_cm REAL CHECK(height_cm IS NULL OR (height_cm > 0 AND height_cm <= 250)),
    head_circumference_cm REAL CHECK(head_circumference_cm IS NULL OR (head_circumference_cm > 0 AND head_circumference_cm <= 100)),
    source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','telegram','import')),
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    CHECK(weight_kg IS NOT NULL OR height_cm IS NOT NULL OR head_circumference_cm IS NOT NULL)
) STRICT;
CREATE INDEX IF NOT EXISTS idx_measurements_child_time ON measurements(child_id, measured_at DESC);

CREATE TABLE IF NOT EXISTS daily_logs (
    id TEXT PRIMARY KEY,
    child_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
    log_date TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('meal','symptom','activity','sleep','note')),
    content TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    UNIQUE(child_id, log_date, category, content)
) STRICT;

CREATE TABLE IF NOT EXISTS food_sources (
    id INTEGER PRIMARY KEY,
    source_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_url TEXT,
    license TEXT,
    snapshot_path TEXT NOT NULL,
    snapshot_sha256 TEXT NOT NULL CHECK(length(snapshot_sha256) = 64),
    snapshot_bytes INTEGER NOT NULL CHECK(snapshot_bytes >= 0),
    imported_at TEXT NOT NULL,
    record_count INTEGER NOT NULL DEFAULT 0 CHECK(record_count >= 0)
) STRICT;

CREATE TABLE IF NOT EXISTS normalization_runs (
    id TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    policy_version TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('running','completed','failed')),
    input_manifest_json TEXT NOT NULL,
    report_json TEXT,
    error TEXT
) STRICT;

CREATE TABLE IF NOT EXISTS raw_food_records (
    id INTEGER PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES food_sources(id) ON DELETE CASCADE,
    normalization_run_id TEXT NOT NULL REFERENCES normalization_runs(id) ON DELETE CASCADE,
    source_record_id TEXT NOT NULL,
    record_type TEXT NOT NULL CHECK(record_type IN ('whole_food_index','packaged_product','bpom_listing','traditional_candidate','additive_rule','unknown')),
    payload_json TEXT NOT NULL,
    payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256) = 64),
    imported_at TEXT NOT NULL,
    UNIQUE(source_id, source_record_id)
) STRICT;
CREATE INDEX IF NOT EXISTS idx_raw_food_type ON raw_food_records(record_type);

CREATE TABLE IF NOT EXISTS canonical_foods (
    id INTEGER PRIMARY KEY,
    canonical_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    brand TEXT,
    barcode TEXT,
    bpom_number TEXT,
    record_type TEXT NOT NULL CHECK(record_type IN ('whole_food_index','packaged_product','bpom_listing','traditional_candidate','additive_rule')),
    verification_status TEXT NOT NULL,
    provenance_score REAL NOT NULL CHECK(provenance_score BETWEEN 0 AND 1),
    completeness_score REAL NOT NULL CHECK(completeness_score BETWEEN 0 AND 1),
    discovery_eligible INTEGER NOT NULL CHECK(discovery_eligible IN (0,1)),
    comparison_eligible INTEGER NOT NULL CHECK(comparison_eligible IN (0,1)),
    planning_eligible INTEGER NOT NULL CHECK(planning_eligible IN (0,1)),
    quarantined INTEGER NOT NULL DEFAULT 0 CHECK(quarantined IN (0,1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_food_normalized_name ON canonical_foods(normalized_name);
CREATE INDEX IF NOT EXISTS idx_food_eligibility ON canonical_foods(planning_eligible, discovery_eligible);
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_barcode ON canonical_foods(barcode) WHERE barcode IS NOT NULL AND barcode <> '';
CREATE INDEX IF NOT EXISTS idx_food_bpom ON canonical_foods(bpom_number) WHERE bpom_number IS NOT NULL AND bpom_number <> '';

CREATE TABLE IF NOT EXISTS food_aliases (
    id INTEGER PRIMARY KEY,
    canonical_food_id INTEGER NOT NULL REFERENCES canonical_foods(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    normalized_alias TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'id',
    UNIQUE(canonical_food_id, normalized_alias)
) STRICT;
CREATE INDEX IF NOT EXISTS idx_alias_normalized ON food_aliases(normalized_alias);

CREATE TABLE IF NOT EXISTS food_source_links (
    canonical_food_id INTEGER NOT NULL REFERENCES canonical_foods(id) ON DELETE CASCADE,
    raw_food_record_id INTEGER NOT NULL UNIQUE REFERENCES raw_food_records(id) ON DELETE CASCADE,
    match_method TEXT NOT NULL CHECK(match_method IN ('source_key','barcode','bpom_number','official_code','unique_name','standalone')),
    match_confidence REAL NOT NULL CHECK(match_confidence BETWEEN 0 AND 1),
    PRIMARY KEY(canonical_food_id, raw_food_record_id)
) STRICT, WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS food_nutrients (
    id INTEGER PRIMARY KEY,
    canonical_food_id INTEGER NOT NULL REFERENCES canonical_foods(id) ON DELETE CASCADE,
    nutrient_key TEXT NOT NULL,
    amount REAL NOT NULL,
    unit TEXT NOT NULL,
    basis TEXT NOT NULL DEFAULT '100g',
    source_raw_id INTEGER NOT NULL REFERENCES raw_food_records(id) ON DELETE CASCADE,
    UNIQUE(canonical_food_id, nutrient_key, basis, source_raw_id)
) STRICT;

CREATE TABLE IF NOT EXISTS food_prices (
    id INTEGER PRIMARY KEY,
    canonical_food_id INTEGER NOT NULL REFERENCES canonical_foods(id) ON DELETE CASCADE,
    amount REAL NOT NULL CHECK(amount >= 0),
    currency TEXT NOT NULL DEFAULT 'IDR',
    unit TEXT NOT NULL,
    observed_at TEXT NOT NULL,
    source_raw_id INTEGER REFERENCES raw_food_records(id) ON DELETE SET NULL
) STRICT;

CREATE TABLE IF NOT EXISTS normalization_issues (
    id INTEGER PRIMARY KEY,
    normalization_run_id TEXT NOT NULL REFERENCES normalization_runs(id) ON DELETE CASCADE,
    raw_food_record_id INTEGER REFERENCES raw_food_records(id) ON DELETE CASCADE,
    issue_code TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('info','warning','error')),
    field_name TEXT,
    message TEXT NOT NULL,
    details_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_normalization_issues_run ON normalization_issues(normalization_run_id, issue_code);

CREATE VIRTUAL TABLE IF NOT EXISTS food_search_fts USING fts5(
    name, aliases, brand, tokenize='unicode61 remove_diacritics 2'
);

CREATE TABLE IF NOT EXISTS agent_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id TEXT REFERENCES child_profiles(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK(job_type IN ('onboarding_summary','measurement_followup','question_answer','daily_followup')),
    trigger TEXT NOT NULL,
    correlation_id TEXT NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL CHECK(status IN ('queued','running','completed','failed','blocked')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0),
    available_at TEXT NOT NULL,
    claimed_at TEXT,
    completed_at TEXT,
    error TEXT,
    created_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_agent_jobs_claim ON agent_jobs(status, available_at, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_user ON agent_jobs(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    job_id TEXT REFERENCES agent_jobs(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id TEXT REFERENCES child_profiles(id) ON DELETE SET NULL,
    correlation_id TEXT NOT NULL,
    trigger TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('running','completed','failed','blocked')),
    model TEXT NOT NULL,
    policy_version TEXT NOT NULL,
    source_version TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    error TEXT,
    structured_output_json TEXT
) STRICT;
CREATE INDEX IF NOT EXISTS idx_agent_runs_user ON agent_runs(user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS agent_steps (
    id INTEGER PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    sequence_no INTEGER NOT NULL CHECK(sequence_no >= 1),
    stage TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('running','completed','failed','blocked','skipped')),
    input_json TEXT NOT NULL,
    output_json TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    error TEXT,
    UNIQUE(run_id, sequence_no)
) STRICT;

CREATE TABLE IF NOT EXISTS agent_actions (
    id INTEGER PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK(action_type IN ('answer','record_summary','queue_followup','external_delivery','blocked')),
    status TEXT NOT NULL CHECK(status IN ('proposed','approved','executed','blocked','failed')),
    payload_json TEXT NOT NULL,
    policy_reason TEXT NOT NULL,
    created_at TEXT NOT NULL,
    executed_at TEXT
) STRICT;

CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id TEXT REFERENCES child_profiles(id) ON DELETE CASCADE,
    schedule_type TEXT NOT NULL CHECK(schedule_type IN ('daily_followup')),
    local_time TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
    next_run_at TEXT NOT NULL,
    last_run_at TEXT,
    created_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_schedules_due ON schedules(enabled, next_run_at);

CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    actor_type TEXT NOT NULL CHECK(actor_type IN ('user','agent','telegram','system')),
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    correlation_id TEXT,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_audit_user_time ON audit_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS inbound_events (
    id INTEGER PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_event_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    received_at TEXT NOT NULL,
    processed_at TEXT,
    status TEXT NOT NULL CHECK(status IN ('received','processed','ignored','failed')),
    error TEXT,
    UNIQUE(provider, provider_event_id)
) STRICT;

CREATE TABLE IF NOT EXISTS outbound_messages (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    channel_identity_id INTEGER REFERENCES channel_identities(id) ON DELETE SET NULL,
    run_id TEXT REFERENCES agent_runs(id) ON DELETE SET NULL,
    chat_id TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('queued','sent','failed','skipped_unconfigured')),
    provider_message_id TEXT,
    response_json TEXT,
    error TEXT,
    created_at TEXT NOT NULL,
    sent_at TEXT
) STRICT;
CREATE INDEX IF NOT EXISTS idx_outbound_status ON outbound_messages(status, created_at);

CREATE TRIGGER IF NOT EXISTS canonical_foods_ai AFTER INSERT ON canonical_foods BEGIN
  INSERT INTO food_search_fts(rowid, name, aliases, brand) VALUES (new.id, new.name, '', coalesce(new.brand,''));
END;
CREATE TRIGGER IF NOT EXISTS canonical_foods_ad AFTER DELETE ON canonical_foods BEGIN
  DELETE FROM food_search_fts WHERE rowid=old.id;
END;
CREATE TRIGGER IF NOT EXISTS canonical_foods_au AFTER UPDATE ON canonical_foods BEGIN
  DELETE FROM food_search_fts WHERE rowid=old.id;
  INSERT INTO food_search_fts(rowid, name, aliases, brand)
  VALUES (new.id, new.name, coalesce((SELECT group_concat(alias, ' ') FROM food_aliases WHERE canonical_food_id=new.id),''), coalesce(new.brand,''));
END;
CREATE TRIGGER IF NOT EXISTS food_aliases_ai AFTER INSERT ON food_aliases BEGIN
  UPDATE food_search_fts SET aliases=coalesce((SELECT group_concat(alias, ' ') FROM food_aliases WHERE canonical_food_id=new.canonical_food_id),'') WHERE rowid=new.canonical_food_id;
END;
CREATE TRIGGER IF NOT EXISTS food_aliases_ad AFTER DELETE ON food_aliases BEGIN
  UPDATE food_search_fts SET aliases=coalesce((SELECT group_concat(alias, ' ') FROM food_aliases WHERE canonical_food_id=old.canonical_food_id),'') WHERE rowid=old.canonical_food_id;
END;
CREATE TRIGGER IF NOT EXISTS food_aliases_au AFTER UPDATE ON food_aliases BEGIN
  UPDATE food_search_fts SET aliases=coalesce((SELECT group_concat(alias, ' ') FROM food_aliases WHERE canonical_food_id=new.canonical_food_id),'') WHERE rowid=new.canonical_food_id;
END;

CREATE TRIGGER IF NOT EXISTS child_owner_consent BEFORE INSERT ON consents
WHEN NEW.child_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM child_profiles WHERE id=NEW.child_id AND user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'child ownership mismatch'); END;

CREATE TRIGGER IF NOT EXISTS job_child_owner BEFORE INSERT ON agent_jobs
WHEN NEW.child_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM child_profiles WHERE id=NEW.child_id AND user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'child ownership mismatch'); END;

CREATE TRIGGER IF NOT EXISTS run_child_owner BEFORE INSERT ON agent_runs
WHEN NEW.child_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM child_profiles WHERE id=NEW.child_id AND user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'child ownership mismatch'); END;

PRAGMA foreign_key_check;

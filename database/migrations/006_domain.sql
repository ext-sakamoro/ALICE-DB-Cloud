-- ALICE DB Cloud: Domain-specific tables
CREATE TABLE IF NOT EXISTS managed_databases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    engine TEXT NOT NULL CHECK (engine IN ('lsm-tree', 'btree', 'columnar')),
    compression TEXT NOT NULL DEFAULT 'alice-zip' CHECK (compression IN ('alice-zip', 'lz4', 'zstd', 'none')),
    connection_string TEXT NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    max_size_bytes BIGINT NOT NULL DEFAULT 1073741824,
    status TEXT NOT NULL DEFAULT 'provisioning' CHECK (status IN ('provisioning', 'active', 'suspended', 'deleted')),
    region TEXT NOT NULL DEFAULT 'us-east-1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS db_replicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id UUID NOT NULL REFERENCES managed_databases(id) ON DELETE CASCADE,
    region TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'async' CHECK (mode IN ('sync', 'async', 'semi-sync')),
    lag_ms BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'provisioning' CHECK (status IN ('provisioning', 'active', 'degraded', 'stopped')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS db_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id UUID NOT NULL REFERENCES managed_databases(id) ON DELETE CASCADE,
    format TEXT NOT NULL DEFAULT 'snapshot' CHECK (format IN ('snapshot', 'logical', 'incremental')),
    size_bytes BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS db_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id UUID NOT NULL REFERENCES managed_databases(id) ON DELETE CASCADE,
    query_type TEXT NOT NULL CHECK (query_type IN ('read', 'write', 'ddl')),
    rows_affected BIGINT NOT NULL DEFAULT 0,
    elapsed_us BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_managed_databases_user ON managed_databases(user_id);
CREATE INDEX idx_db_replicas_database ON db_replicas(database_id);
CREATE INDEX idx_db_backups_database ON db_backups(database_id);
CREATE INDEX idx_db_query_logs_database ON db_query_logs(database_id, created_at);

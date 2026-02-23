use axum::{extract::State, response::Json, routing::{get, post}, Router};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

// ── State ───────────────────────────────────────────────────
struct AppState {
    start_time: Instant,
    stats: Mutex<Stats>,
}

struct Stats {
    total_queries: u64,
    total_writes: u64,
    total_backups: u64,
    total_replications: u64,
    bytes_stored: u64,
}

// ── Types ───────────────────────────────────────────────────
#[derive(Serialize)]
struct Health { status: String, version: String, uptime_secs: u64, total_ops: u64 }

#[derive(Deserialize)]
struct QueryRequest { sql: String, database: Option<String>, timeout_ms: Option<u64> }
#[derive(Serialize)]
struct QueryResponse {
    query_id: String, status: String, database: String,
    rows_affected: u64, columns: Vec<String>,
    rows: Vec<Vec<serde_json::Value>>,
    elapsed_us: u128,
}

#[derive(Deserialize)]
struct WriteRequest { sql: String, database: Option<String>, params: Option<Vec<serde_json::Value>> }
#[derive(Serialize)]
struct WriteResponse {
    write_id: String, status: String, database: String,
    rows_affected: u64, elapsed_us: u128,
}

#[derive(Deserialize)]
struct CreateDbRequest { name: String, engine: Option<String>, compression: Option<String> }
#[derive(Serialize)]
struct CreateDbResponse {
    db_id: String, name: String, engine: String, compression: String,
    status: String, connection_string: String,
}

#[derive(Deserialize)]
struct BackupRequest { database: String, format: Option<String> }
#[derive(Serialize)]
struct BackupResponse {
    backup_id: String, database: String, format: String,
    size_bytes: u64, status: String, elapsed_us: u128,
}

#[derive(Deserialize)]
struct ReplicaRequest { database: String, region: Option<String>, mode: Option<String> }
#[derive(Serialize)]
struct ReplicaResponse {
    replica_id: String, database: String, region: String,
    mode: String, status: String, lag_ms: u64,
}

#[derive(Serialize)]
struct EngineInfo { name: String, description: String, compression_ratio: String, best_for: String }

#[derive(Serialize)]
struct StatsResponse {
    total_queries: u64, total_writes: u64, total_backups: u64,
    total_replications: u64, bytes_stored: u64,
}

// ── Main ────────────────────────────────────────────────────
#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "db_engine=info".into()))
        .init();
    let state = Arc::new(AppState {
        start_time: Instant::now(),
        stats: Mutex::new(Stats {
            total_queries: 0, total_writes: 0, total_backups: 0,
            total_replications: 0, bytes_stored: 0,
        }),
    });
    let cors = CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any);
    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/db/query", post(query))
        .route("/api/v1/db/write", post(write))
        .route("/api/v1/db/create", post(create_db))
        .route("/api/v1/db/backup", post(backup))
        .route("/api/v1/db/replica", post(create_replica))
        .route("/api/v1/db/engines", get(engines))
        .route("/api/v1/db/stats", get(stats))
        .layer(cors).layer(TraceLayer::new_for_http()).with_state(state);
    let addr = std::env::var("DB_ADDR").unwrap_or_else(|_| "0.0.0.0:8081".into());
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    tracing::info!("DB Engine on {addr}");
    axum::serve(listener, app).await.unwrap();
}

// ── Handlers ────────────────────────────────────────────────
async fn health(State(s): State<Arc<AppState>>) -> Json<Health> {
    let st = s.stats.lock().unwrap();
    Json(Health {
        status: "ok".into(), version: env!("CARGO_PKG_VERSION").into(),
        uptime_secs: s.start_time.elapsed().as_secs(),
        total_ops: st.total_queries + st.total_writes,
    })
}

async fn query(State(s): State<Arc<AppState>>, Json(req): Json<QueryRequest>) -> Json<QueryResponse> {
    let t = Instant::now();
    let db = req.database.unwrap_or_else(|| "default".into());
    let h = fnv1a(req.sql.as_bytes());
    let row_count = (h % 100) + 1;
    let cols = vec!["id".into(), "name".into(), "value".into(), "created_at".into()];
    let mut rows = Vec::new();
    for i in 0..row_count {
        rows.push(vec![
            serde_json::json!(i + 1),
            serde_json::json!(format!("row_{}", i + 1)),
            serde_json::json!((h.wrapping_add(i) % 10000) as f64 / 100.0),
            serde_json::json!("2026-02-23T00:00:00Z"),
        ]);
    }
    s.stats.lock().unwrap().total_queries += 1;
    Json(QueryResponse {
        query_id: uuid::Uuid::new_v4().to_string(), status: "completed".into(),
        database: db, rows_affected: row_count, columns: cols, rows, elapsed_us: t.elapsed().as_micros(),
    })
}

async fn write(State(s): State<Arc<AppState>>, Json(req): Json<WriteRequest>) -> Json<WriteResponse> {
    let t = Instant::now();
    let db = req.database.unwrap_or_else(|| "default".into());
    let affected = if req.params.is_some() { req.params.as_ref().unwrap().len() as u64 } else { 1 };
    {
        let mut st = s.stats.lock().unwrap();
        st.total_writes += 1;
        st.bytes_stored += req.sql.len() as u64 * 10;
    }
    Json(WriteResponse {
        write_id: uuid::Uuid::new_v4().to_string(), status: "completed".into(),
        database: db, rows_affected: affected, elapsed_us: t.elapsed().as_micros(),
    })
}

async fn create_db(State(_s): State<Arc<AppState>>, Json(req): Json<CreateDbRequest>) -> Json<CreateDbResponse> {
    let engine = req.engine.unwrap_or_else(|| "lsm-tree".into());
    let compression = req.compression.unwrap_or_else(|| "alice-zip".into());
    Json(CreateDbResponse {
        db_id: uuid::Uuid::new_v4().to_string(), name: req.name.clone(),
        engine, compression, status: "created".into(),
        connection_string: format!("alice-db://{}:5432/{}", "db-cloud.alice-platform.com", req.name),
    })
}

async fn backup(State(s): State<Arc<AppState>>, Json(req): Json<BackupRequest>) -> Json<BackupResponse> {
    let t = Instant::now();
    let fmt = req.format.unwrap_or_else(|| "snapshot".into());
    let h = fnv1a(req.database.as_bytes());
    let size = (h % 1_000_000) + 100_000;
    s.stats.lock().unwrap().total_backups += 1;
    Json(BackupResponse {
        backup_id: uuid::Uuid::new_v4().to_string(), database: req.database,
        format: fmt, size_bytes: size, status: "completed".into(),
        elapsed_us: t.elapsed().as_micros(),
    })
}

async fn create_replica(State(s): State<Arc<AppState>>, Json(req): Json<ReplicaRequest>) -> Json<ReplicaResponse> {
    let region = req.region.unwrap_or_else(|| "us-east-1".into());
    let mode = req.mode.unwrap_or_else(|| "async".into());
    let lag = if mode == "sync" { 0 } else { 50 };
    s.stats.lock().unwrap().total_replications += 1;
    Json(ReplicaResponse {
        replica_id: uuid::Uuid::new_v4().to_string(), database: req.database,
        region, mode, status: "provisioning".into(), lag_ms: lag,
    })
}

async fn engines() -> Json<Vec<EngineInfo>> {
    Json(vec![
        EngineInfo { name: "lsm-tree".into(), description: "Model-based LSM-Tree with ALICE-Zip compression".into(), compression_ratio: "10-50x".into(), best_for: "Write-heavy workloads, time-series, IoT".into() },
        EngineInfo { name: "btree".into(), description: "B-Tree with page-level compression".into(), compression_ratio: "3-5x".into(), best_for: "Read-heavy OLTP, point queries".into() },
        EngineInfo { name: "columnar".into(), description: "Column-oriented with procedural compression".into(), compression_ratio: "50-1000x".into(), best_for: "Analytics, OLAP, data warehousing".into() },
    ])
}

async fn stats(State(s): State<Arc<AppState>>) -> Json<StatsResponse> {
    let st = s.stats.lock().unwrap();
    Json(StatsResponse {
        total_queries: st.total_queries, total_writes: st.total_writes,
        total_backups: st.total_backups, total_replications: st.total_replications,
        bytes_stored: st.bytes_stored,
    })
}

fn fnv1a(data: &[u8]) -> u64 {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for &b in data { h ^= b as u64; h = h.wrapping_mul(0x0100_0000_01b3); }
    h
}

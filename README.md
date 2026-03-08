# ALICE-DB-Cloud

Cloud-native database service with multi-engine storage, ALICE-Zip compression, backup, and synchronous multi-region replication — exposed through a single unified REST API.

## Architecture

```
Client
  │
  ▼
┌─────────────────────────────────────────┐
│            ALICE-DB-Cloud API           │
│         (Rust / Axum, port 8081)        │
└────────────┬──────────────┬────────────┘
             │              │
    ┌─────────────┐  ┌──────────────┐
    │  Query      │  │  Write       │
    │  Processor  │  │  Pipeline    │
    └──────┬──────┘  └──────┬───────┘
           │                │
  ┌────────▼───────────────▼────────┐
  │         Storage Engine Layer    │
  │  LSM-Tree │ B-Tree │ Columnar  │
  └────────────────────────────────┘
           │
  ┌────────▼────────┐
  │  ALICE-Zip      │
  │  Compression    │
  └────────┬────────┘
           │
  ┌────────▼────────────────────────┐
  │  Backup & Replication Manager   │
  │  (S3-compatible + Multi-region) │
  └─────────────────────────────────┘
```

## Features

| Feature | Details |
|---------|---------|
| SQL Query Engine | Full SQL with joins, aggregations, window functions |
| LSM-Tree Engine | Write-optimized; ideal for time-series and append workloads |
| B-Tree Engine | Read-optimized; ideal for OLTP and key lookups |
| Columnar Engine | Analytical queries; ideal for OLAP and aggregations |
| ALICE-Zip Compression | Up to 3x storage savings, hardware-accelerated decompression |
| Encrypted Backups | AES-256 backups to any S3-compatible object store |
| Replication | Synchronous multi-region with automatic failover |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/db/query` | Execute SQL query against selected engine |
| POST | `/api/v1/db/write` | Write one or more records to a table |
| POST | `/api/v1/db/create` | Create a new database or table |
| POST | `/api/v1/db/backup` | Trigger an encrypted backup to object storage |
| POST | `/api/v1/db/replica` | Configure a replication target |
| GET | `/api/v1/db/engines` | List available storage engines and their status |
| GET | `/api/v1/db/stats` | Runtime statistics: QPS, latency, storage usage |

## Quick Start

```bash
# Clone and start the backend
git clone https://github.com/your-org/ALICE-DB-Cloud.git
cd ALICE-DB-Cloud
cargo run --release

# In a second terminal, start the frontend
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Example: SQL Query

```bash
curl -X POST http://localhost:8081/api/v1/db/query \
  -H "Content-Type: application/json" \
  -d '{"engine":"lsm","sql":"SELECT * FROM events LIMIT 5;"}'
```

### Example: Write Record

```bash
curl -X POST http://localhost:8081/api/v1/db/write \
  -H "Content-Type: application/json" \
  -d '{"engine":"btree","table":"users","data":{"id":1,"name":"Alice"}}'
```

### Example: Trigger Backup

```bash
curl -X POST http://localhost:8081/api/v1/db/backup \
  -H "Content-Type: application/json" \
  -d '{"database":"primary","destination":"s3://backups/db/"}'
```

## License

AGPL-3.0-or-later — see [LICENSE](LICENSE) for details.

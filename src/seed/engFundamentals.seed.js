/**
 * Engineering Fundamentals seed — idempotent (safe to run multiple times).
 *
 * Content sourced from:
 *   • https://github.com/yangshun/tech-interview-handbook (MIT)
 *   • https://github.com/donnemartin/system-design-primer (CC-BY-SA 4.0)
 *   • https://github.com/jwasham/coding-interview-university (MIT)
 *   • CompileHub frontend data.ts (curated)
 *
 * Run: node src/seed/engFundamentals.seed.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// TOPICS DATA
// ─────────────────────────────────────────────────────────────────────────────

const TOPICS = [
  {
    title: "Operating Systems",
    description:
      "Master processes, memory management, scheduling, and concurrency — the foundation every backend engineer needs.",
    icon: "🖥️",
    accentColor: "rgba(99,102,241,0.08)",
    borderColor: "rgba(99,102,241,0.25)",
    glowColor: "rgba(99,102,241,0.15)",
    order: 1,
    concepts: [
      {
        title: "Processes & Threads",
        order: 0,
        body: `A **process** is an instance of a running program. The OS represents it with a **Process Control Block (PCB)** that stores: process state (new/ready/running/waiting/terminated), program counter, CPU registers, memory limits, open file descriptors, and scheduling info.

A **thread** is the smallest unit of CPU scheduling within a process. Threads in the same process share the heap, code segment, and open files, but each has its own stack and registers.

**Context switching** is the act of saving the CPU state of the current process/thread and restoring that of the next. It is triggered by a timer interrupt (preemptive scheduling), a system call (voluntary), or I/O completion. Context switching is expensive — it pollutes CPU caches and TLB.

**User-level threads** (green threads) are managed by a runtime library; the kernel sees only one kernel thread. They switch faster but cannot run in parallel on multi-core CPUs. **Kernel-level threads** are managed by the OS and can run truly in parallel, but each switch requires a kernel trap.

Key interview traps:
- A process crash does not kill other processes (memory isolation). A thread crash usually kills the whole process.
- fork() creates a copy-on-write duplicate of the parent's address space; exec() replaces it with a new program image.`,
      },
      {
        title: "Memory Management & Virtual Memory",
        order: 1,
        body: `**Virtual memory** gives each process the illusion of its own private, contiguous address space, decoupling logical addresses from physical RAM.

**Paging** divides virtual and physical memory into fixed-size blocks called *pages* (typically 4 KB). The OS maintains a **page table** per process mapping virtual page numbers → physical frame numbers. Multi-level page tables (2–4 levels on x86-64) keep memory overhead manageable.

**Page faults** occur when the CPU references a virtual page that has no valid physical mapping:
1. Minor fault — page is in memory but not mapped (e.g., copy-on-write). Fast.
2. Major fault — page must be read from disk (swap). Slow (~10 ms).
3. Invalid fault — segfault (process killed).

The **Translation Lookaside Buffer (TLB)** is a fully associative hardware cache of recent VPN→PFN translations. A TLB hit completes in ~1 ns; a miss requires a full page-table walk (~50–100 ns). Context switches typically flush the TLB (unless the CPU supports ASIDs).

**Memory allocation strategies**: best-fit, worst-fit, first-fit. Modern allocators (jemalloc, tcmalloc) use size-class slabs to reduce fragmentation.

**OOM killer**: when physical memory is exhausted, the Linux kernel selects a process to kill based on an *oom_score* (weighs RSS, swap, niceness).`,
      },
      {
        title: "Deadlocks",
        order: 2,
        body: `A **deadlock** occurs when a set of processes are each waiting for a resource held by another in the set, forming a cycle — and none can proceed.

**Coffman's four necessary conditions** (all must hold simultaneously):
1. **Mutual exclusion** — at least one resource is non-shareable.
2. **Hold and wait** — a process holds resources while waiting for more.
3. **No preemption** — resources cannot be forcibly taken away.
4. **Circular wait** — P1 waits on P2, P2 waits on P3, … Pn waits on P1.

**Strategies**:
- **Prevention** — break any one Coffman condition (e.g., require all resources upfront, impose a global lock order).
- **Avoidance** — Banker's Algorithm: grant a request only if the resulting state remains *safe* (a safe state has at least one process that can run to completion with available resources).
- **Detection & recovery** — allow deadlocks to occur, detect cycles in the resource-allocation graph, then recover by preempting or killing a process.
- **Ignore** — the ostrich algorithm; used when deadlocks are rare and recovery is cheap (e.g., restart a single thread).

**Livelocks** and **starvation** are related: livelock processes are active but make no progress (both keep backing off); starvation means a process never gets scheduled (solvable with aging — incrementally raise priority of waiting processes).`,
      },
      {
        title: "CPU Scheduling",
        order: 3,
        body: `The **scheduler** decides which ready thread runs next. Key metrics: *throughput*, *turnaround time*, *waiting time*, *response time*, *fairness*.

**Algorithms**:
- **FCFS (First-Come, First-Served)** — simple FIFO queue. Suffers from the *convoy effect*: one long job blocks all short jobs.
- **SJF / SRTF** — Shortest Job First (non-preemptive) or Shortest Remaining Time First (preemptive). Optimal for average waiting time but requires future burst knowledge (estimated via exponential averaging).
- **Round Robin (RR)** — each process gets a time quantum *q*. If *q* too large → FCFS. If *q* too small → excessive context-switch overhead. Typical quantum: 10–100 ms.
- **Priority Scheduling** — assign each process a priority; always run highest. Risk: *starvation* of low-priority processes. Fix: **aging** (increase priority as wait time grows).
- **Multilevel Feedback Queue (MLFQ)** — multiple RR queues at different priorities. New jobs start at top (short quantum); if they use the full quantum, demote to lower queue. CPU-bound jobs sink, I/O-bound jobs stay high. Used in Linux CFS ancestor.

**Linux CFS (Completely Fair Scheduler)** uses a red-black tree keyed on *virtual runtime* (actual CPU time × weight). The thread with the smallest virtual runtime runs next. Each thread's weight reflects its *nice* value.

**Real-time scheduling**: FIFO-RT, RR-RT — hard deadlines, preempt normal tasks.`,
      },
    ],
    qna: [
      {
        question: "What is the difference between a process and a thread?",
        order: 0,
        answer: `A **process** is an independent program in execution with its own isolated address space, file handles, and OS resources. Processes communicate via IPC (pipes, sockets, shared memory).

A **thread** is a unit of execution within a process. All threads in a process share the same heap and code segment but have separate stacks and register sets.

Key differences:
| | Process | Thread |
|---|---|---|
| Memory | Isolated | Shared within process |
| Creation cost | High (fork + exec) | Low |
| Crash impact | Only itself | Can kill entire process |
| Communication | IPC (slower) | Shared memory (faster, but needs sync) |
| Context switch | Expensive (TLB flush) | Cheaper |

Use threads for parallelism within a single task (e.g., a web server handling concurrent requests). Use processes for isolation (e.g., browser tabs, microservices).`,
      },
      {
        question: "How does virtual memory work?",
        order: 1,
        answer: `Virtual memory abstracts physical RAM so each process sees a large, contiguous address space (e.g., 0 to 2⁴⁸ bytes on x86-64) regardless of actual available RAM.

**Mechanism**:
1. The CPU generates a *virtual address*.
2. The MMU checks the **TLB** for a cached translation. On a hit, the physical address is returned immediately.
3. On a TLB miss, the MMU walks the **page table** (stored in RAM) to find the physical frame.
4. If the page is not in RAM (not present bit), the CPU raises a **page fault** and the OS handles it:
   - Load the page from swap/disk into a free frame.
   - Update the page table entry.
   - Restart the faulting instruction.

**Benefits**: isolation between processes, ability to run programs larger than RAM, copy-on-write fork, memory-mapped files, demand paging (only load pages actually accessed).

**Costs**: TLB misses add latency; major page faults (disk I/O) are very expensive. Huge pages (2 MB / 1 GB) reduce TLB pressure for large working sets.`,
      },
      {
        question: "What is a race condition and how do you prevent it?",
        order: 2,
        answer: `A **race condition** occurs when the correctness of a computation depends on the relative timing of concurrent threads or processes accessing shared state. The outcome is non-deterministic.

**Classic example**: two threads both read a counter (value = 5), both increment locally, both write back — final value is 6 instead of 7.

**Prevention techniques**:
- **Mutex (mutual exclusion lock)** — only one thread holds the lock at a time. Use for short critical sections. Risk: deadlock if lock order is inconsistent.
- **Semaphore** — signaling mechanism. Binary semaphore ≈ mutex; counting semaphore limits concurrent access to N.
- **Atomic operations** — hardware-guaranteed read-modify-write (e.g., CAS, fetch-add). Lock-free and fast for simple counters/flags.
- **Immutability** — if shared data never changes, no synchronization is needed.
- **Message passing / actor model** — threads own their state and communicate via queues (Go channels, Erlang actors). No shared memory = no races.
- **Database transactions** — ACID isolation ensures concurrent transactions behave correctly.

**Detecting races**: ThreadSanitizer (TSan), Helgrind, careful code review. Writing deterministic tests for concurrent code is notoriously hard — use stress tests and fuzz testing.`,
      },
    ],
    quiz: [
      {
        question: "Which CPU scheduling algorithm can cause starvation of lower-priority processes?",
        order: 0,
        options: ["Round Robin", "FCFS", "Priority Scheduling", "Shortest Job First"],
        correctIndex: 2,
        explanation:
          "Priority Scheduling always runs the highest-priority ready process. If high-priority processes continuously arrive, lower-priority ones never get the CPU — this is starvation. The fix is aging: gradually increase a process's priority the longer it waits.",
      },
      {
        question: "What is the primary purpose of the Translation Lookaside Buffer (TLB)?",
        order: 1,
        options: [
          "To store recently used disk blocks in RAM",
          "To cache virtual-to-physical address translations",
          "To buffer network packets before delivery",
          "To hold the OS page replacement policy",
        ],
        correctIndex: 1,
        explanation:
          "The TLB is a small, fast hardware cache inside the MMU that stores recent virtual-page-number → physical-frame-number mappings. A TLB hit avoids the expensive multi-level page-table walk, completing in ~1 ns instead of ~50–100 ns. TLB misses and context-switch flushes are a key source of memory-access latency.",
      },
      {
        question: "Which of the following is NOT one of Coffman's four conditions for deadlock?",
        order: 2,
        options: [
          "Mutual exclusion",
          "Hold and wait",
          "Priority inversion",
          "Circular wait",
        ],
        correctIndex: 2,
        explanation:
          "Coffman's four necessary conditions for deadlock are: (1) Mutual exclusion, (2) Hold and wait, (3) No preemption, and (4) Circular wait. Priority inversion is a separate scheduling problem where a high-priority task is blocked by a lower-priority task holding a shared lock — it is not a deadlock condition.",
      },
    ],
  },

  {
    title: "Databases",
    description:
      "Deep-dive into ACID, indexing strategies, normalization, and distributed database trade-offs.",
    icon: "🗄️",
    accentColor: "rgba(16,185,129,0.08)",
    borderColor: "rgba(16,185,129,0.25)",
    glowColor: "rgba(16,185,129,0.15)",
    order: 2,
    concepts: [
      {
        title: "ACID Properties",
        order: 0,
        body: `**ACID** is the set of guarantees that make database transactions reliable.

**Atomicity** — a transaction is all-or-nothing. If any statement fails, the entire transaction is rolled back as if it never happened. Implemented via the **Write-Ahead Log (WAL)**: every change is written to the log before being applied to data pages. On crash recovery, incomplete transactions are rolled back using the log.

**Consistency** — a transaction brings the database from one valid state to another, preserving all defined invariants (foreign keys, unique constraints, check constraints, application-level rules). Consistency is partly a database guarantee and partly an application responsibility.

**Isolation** — concurrent transactions behave as if they were serial. The degree of isolation is configurable:
- *Read Uncommitted* — can see uncommitted changes (dirty reads). Fastest, rarely used.
- *Read Committed* — only see committed data. Default in PostgreSQL, Oracle.
- *Repeatable Read* — same read returns same data within a transaction. Default in MySQL InnoDB.
- *Serializable* — full isolation; implemented via predicate locks or MVCC + validation.

**Durability** — once committed, data survives crashes. Achieved by flushing the WAL to disk (fsync) before acknowledging the commit. *Group commit* batches multiple fsync calls for throughput.

**MVCC (Multi-Version Concurrency Control)** — PostgreSQL and MySQL InnoDB maintain multiple row versions. Readers never block writers; each transaction sees a snapshot of the database at its start time. Old versions are cleaned up by a *vacuum* process.`,
      },
      {
        title: "Indexing",
        order: 1,
        body: `An **index** is a separate data structure that allows the database to find rows without a full table scan.

**B-tree index** (default in PostgreSQL, MySQL) — a self-balancing tree where all leaves are at the same depth. Supports equality (=), range (<, >, BETWEEN), ORDER BY, and prefix queries. O(log n) lookups, O(log n) inserts. Works for high-cardinality columns.

**Hash index** — maps each key to a fixed bucket. O(1) equality lookups but does not support range queries. Used in PostgreSQL for in-memory hash joins.

**Composite index** — index on (col1, col2, …). Follows the **leftmost prefix rule**: the index can satisfy queries that filter on col1 alone, or col1+col2, etc., but not col2 alone. Column order matters: put the most selective column first, unless you have range predicates (put equality columns before range columns).

**Covering index** — includes all columns needed by a query in the index itself (using INCLUDE in PostgreSQL). The query can be answered entirely from the index without touching the heap (table) — called an *index-only scan*.

**Write overhead** — every INSERT, UPDATE, DELETE must update all indexes on the table. Heavy write workloads benefit from fewer, carefully chosen indexes. Watch for index bloat after many deletes.

**When not to index** — low-cardinality columns (boolean, enum with few values), very small tables, columns that are almost never queried.`,
      },
      {
        title: "Normalization & Denormalization",
        order: 2,
        body: `**Normalization** organizes a relational schema to eliminate data redundancy and update anomalies.

- **1NF** — all column values are atomic (no repeating groups or arrays in columns).
- **2NF** — 1NF + no partial dependency (every non-key attribute depends on the *whole* primary key, not part of it). Relevant only for composite keys.
- **3NF** — 2NF + no transitive dependency (non-key attributes depend only on the key, not on other non-key attributes). Most production schemas target 3NF.
- **BCNF (Boyce-Codd NF)** — every determinant is a candidate key. Stricter than 3NF; eliminates remaining anomalies but may lose some functional dependencies.

**Denormalization** deliberately introduces redundancy to improve read performance:
- Flatten joins by copying columns from related tables.
- Store precomputed aggregates (e.g., \`likes_count\` on a post row).
- Duplicate data across microservices to avoid cross-service joins.

**When to denormalize**:
- Read-heavy workloads where joins are a bottleneck.
- Analytics / OLAP queries spanning billions of rows (wide flat tables, columnar storage like Parquet).
- Materialized views are a middle ground — the DB maintains the denormalized view automatically.

**Trade-offs**: denormalization increases write complexity (must update copies), risks data inconsistency, and makes schema evolution harder.`,
      },
      {
        title: "CAP Theorem & Distributed DBs",
        order: 3,
        body: `**CAP Theorem** (Brewer, 2000) states that a distributed data store can guarantee at most two of three properties simultaneously:

- **Consistency (C)** — every read returns the most recent write or an error. (Note: this is linearizability, not ACID consistency.)
- **Availability (A)** — every request receives a non-error response (though it may be stale).
- **Partition Tolerance (P)** — the system continues to operate despite network partitions (lost messages between nodes).

Since network partitions are inevitable in real distributed systems, you must choose **CP** or **AP**:
- **CP systems** (e.g., HBase, Zookeeper, etcd, MongoDB with majority writes) sacrifice availability during a partition — some nodes refuse requests to preserve consistency.
- **AP systems** (e.g., Cassandra, DynamoDB, CouchDB) remain available during partitions but may serve stale data; they reconcile diverged state afterward (eventual consistency).

**PACELC extension** (Abadi, 2012) adds the latency dimension: even without a partition (Else), you must choose between Latency and Consistency. Example: Cassandra (PA/EL) prioritizes availability and low latency; HBase (PC/EC) prioritizes consistency.

**Replication strategies**:
- *Single-leader* — strong consistency, limited write throughput.
- *Multi-leader* — higher write throughput, conflict resolution required (last-write-wins, CRDTs).
- *Leaderless (quorum)* — reads/writes require W+R>N acknowledgments; tunable consistency.`,
      },
    ],
    qna: [
      {
        question: "What is the difference between optimistic and pessimistic locking?",
        order: 0,
        answer: `**Pessimistic locking** assumes conflicts are likely. It acquires an exclusive lock before reading the data and holds it until the transaction commits. Other transactions trying to access the same row block until the lock is released.

Example (PostgreSQL): \`SELECT ... FOR UPDATE\`

Pros: prevents conflicts entirely. Cons: high contention, risk of deadlock, degrades throughput under load.

**Optimistic locking** assumes conflicts are rare. It reads data without locking, performs its work, then checks at commit time whether the data was modified by another transaction (via a version number or timestamp column). If a conflict is detected, the transaction is retried.

Example: Check \`version = originalVersion\` in the UPDATE WHERE clause; if 0 rows updated, retry.

Pros: no locking overhead during the happy path, high throughput. Cons: wasted work on retry if conflicts are actually frequent.

**When to use which**:
- High-contention, short transactions → pessimistic.
- Low-contention, read-heavy, or long-running operations → optimistic.`,
      },
      {
        question: "When would you choose NoSQL over a relational database?",
        order: 1,
        answer: `Choose **NoSQL** when:

1. **Schema flexibility is needed** — document stores (MongoDB) allow different fields per document; ideal for user-generated or evolving data shapes.
2. **Massive horizontal scale** — key-value and wide-column stores (DynamoDB, Cassandra) are designed to shard across hundreds of nodes with near-linear write throughput.
3. **Very high write throughput** — Cassandra achieves ~1M writes/sec on a cluster by using append-only SSTables and no strict consistency requirement.
4. **Specific access patterns** — graph databases (Neo4j) for relationship-heavy queries; time-series DBs (InfluxDB, TimescaleDB) for metrics; search engines (Elasticsearch) for full-text search.
5. **Low-latency key lookups** — Redis, DynamoDB for sub-millisecond reads where relational joins are unnecessary.

Stick with **SQL (relational)** when:
- You need ACID transactions across multiple entities.
- Your data has rich relationships that benefit from joins.
- Your query patterns are ad-hoc / analytical.
- You need strong consistency guarantees.

In practice, many systems use both: PostgreSQL for transactional data + Redis for caching + Elasticsearch for search.`,
      },
      {
        question: "How do indexes affect write performance?",
        order: 2,
        answer: `Every index must be maintained on every write operation:

- **INSERT** — the new row must be inserted into every index on the table.
- **UPDATE** — if an indexed column's value changes, the old entry must be removed and the new value inserted into the index. Even if an unindexed column changes, PostgreSQL's MVCC creates a new row version and may need to update all indexes (HOT updates optimize this for heap-only tuples when the index column is unchanged).
- **DELETE** — the index entry must be marked as dead; vacuum eventually reclaims the space.

**Impact scales with index count**: a table with 10 indexes on it means each write touches 10 additional data structures. For write-heavy workloads (IoT ingestion, event logs), minimizing index count is critical.

**Strategies to mitigate write overhead**:
- **Partial indexes** — only index a subset of rows (e.g., WHERE status = 'active'). Smaller, faster to update.
- **Deferred/background indexing** — build indexes after bulk loads (CREATE INDEX CONCURRENTLY in PostgreSQL).
- **Write-optimized structures** — LSM trees (used in RocksDB, Cassandra, LevelDB) batch writes and merge them in the background, offering much better write throughput than B-trees at the cost of read amplification.`,
      },
    ],
    quiz: [
      {
        question:
          "Which isolation level prevents dirty reads but still allows non-repeatable reads?",
        order: 0,
        options: [
          "Read Uncommitted",
          "Read Committed",
          "Repeatable Read",
          "Serializable",
        ],
        correctIndex: 1,
        explanation:
          "Read Committed ensures you only see committed data, so dirty reads (reading uncommitted data) are impossible. However, if you read the same row twice in one transaction, another committed transaction may have modified it between your two reads — a non-repeatable read. PostgreSQL's default isolation level is Read Committed.",
      },
      {
        question:
          "You have a composite index on (status, created_at). Which query will use this index most efficiently?",
        order: 1,
        options: [
          "WHERE created_at > '2024-01-01'",
          "WHERE status = 'active' AND created_at > '2024-01-01'",
          "WHERE created_at > '2024-01-01' AND status = 'active'",
          "WHERE status LIKE '%act%'",
        ],
        correctIndex: 1,
        explanation:
          "The leftmost prefix rule means the index on (status, created_at) can efficiently satisfy queries that filter on `status` first. Option B and C are semantically identical — the query planner reorders conditions — but B is written in the canonical leftmost-prefix order. Option A skips `status` (the leftmost column), so the index cannot be used for a range scan. Option D uses LIKE with a leading wildcard, which cannot use a B-tree index.",
      },
      {
        question: "What is the primary purpose of the Write-Ahead Log (WAL) in a database?",
        order: 2,
        options: [
          "To speed up SELECT queries by caching hot rows",
          "To replicate data to read replicas",
          "To enable crash recovery and ensure transaction durability",
          "To enforce foreign key constraints",
        ],
        correctIndex: 2,
        explanation:
          "The WAL records every change before it is applied to the actual data pages. If the database crashes mid-transaction, the WAL is replayed on restart to redo committed changes and undo incomplete ones — guaranteeing durability and atomicity. As a bonus, the WAL is also streamed to replicas for replication, but that is a secondary use.",
      },
    ],
  },

  {
    title: "Networks",
    description:
      "TCP/IP fundamentals, HTTP internals, DNS resolution, and load balancing — what every full-stack engineer must know.",
    icon: "🌐",
    accentColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.25)",
    glowColor: "rgba(245,158,11,0.15)",
    order: 3,
    concepts: [
      {
        title: "TCP vs UDP",
        order: 0,
        body: `**TCP (Transmission Control Protocol)** is a connection-oriented, reliable protocol.

*Connection establishment* — 3-way handshake: SYN → SYN-ACK → ACK. Creates shared state (sequence numbers, window size) on both sides.

*Reliability* — every segment is acknowledged. Lost segments are retransmitted using selective ACKs (SACK). Sequence numbers enable in-order delivery.

*Flow control* — the receiver advertises its available *receive window* to prevent the sender from overwhelming it.

*Congestion control* — algorithms (CUBIC, BBR) detect network congestion via packet loss or latency and back off. *Slow start* ramps up the *congestion window* exponentially until a threshold, then linearly.

*Connection teardown* — 4-way FIN handshake. TIME_WAIT state lasts 2×MSL (~60–120 s) to absorb delayed duplicate packets.

**UDP (User Datagram Protocol)** is connectionless and unreliable. No handshake, no ACKs, no ordering guarantees. Headers are 8 bytes vs TCP's 20+ bytes.

Use UDP for: DNS (single request-response), video/audio streaming (latency beats reliability), online games, multicast.

**QUIC** (HTTP/3) runs over UDP and re-implements reliability, multiplexing, and TLS 1.3 at the application layer. Key advantage: no head-of-line blocking at the transport layer, and 0-RTT reconnection for returning clients.`,
      },
      {
        title: "HTTP/1.1, HTTP/2 & HTTPS",
        order: 1,
        body: `**HTTP/1.1** (1997) — text-based protocol over TCP. Key features: persistent connections (Connection: keep-alive), chunked transfer encoding, Host header enabling virtual hosting. Main problem: *head-of-line blocking* — only one request can be in-flight per connection at a time (pipelining helps but is rarely enabled due to proxy compatibility issues). Browsers open 6 connections per origin as a workaround.

**HTTP/2** (2015) — binary framing over a single TCP connection.
- *Multiplexing* — multiple request/response streams interleaved on one connection; no HOL blocking at the HTTP layer.
- *Header compression (HPACK)* — uses Huffman coding and a static/dynamic table to compress repetitive headers (e.g., Cookie, User-Agent).
- *Server push* — server can proactively send resources the client will need.
- *Stream priority* — clients can signal which responses are most urgent.
- Still subject to TCP-level HOL blocking if a packet is lost.

**HTTPS** — HTTP over TLS. TLS 1.3 (2018) reduced the handshake to 1-RTT (from 2-RTT in TLS 1.2). With 0-RTT (early data), returning clients can send data immediately — but this has replay-attack risks.

TLS handshake flow (1.3): Client Hello (supported ciphers + key share) → Server Hello (chosen cipher + key share + Certificate + Finished) → Client Finished. Keys are derived via ECDHE; forward secrecy is guaranteed.`,
      },
      {
        title: "DNS Resolution",
        order: 2,
        body: `**DNS (Domain Name System)** translates human-readable names (e.g., api.compilehub.io) into IP addresses.

**Full recursive resolution chain** for a cold cache:
1. Application calls \`getaddrinfo()\` → OS checks local cache (/etc/hosts, nscd/resolved cache).
2. **Recursive resolver** (e.g., 8.8.8.8) is queried. It checks its own cache.
3. If not cached → queries a **Root Name Server** (".") → returns NS records for the TLD (.io).
4. Queries the **TLD Name Server** → returns NS records for compilehub.io.
5. Queries the **Authoritative Name Server** for compilehub.io → returns the A/AAAA record.
6. Resolver caches the result per TTL and returns it to the client.

**Common record types**: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), TXT (SPF, DKIM, ownership proof), NS (authoritative servers), SOA (zone metadata), SRV (service location).

**TTL (Time To Live)** — DNS caches expire after TTL seconds. Low TTL (60–300 s) allows fast failover but increases resolver load. High TTL (86400 s) reduces load but slows propagation.

**DNS over HTTPS (DoH)** and DNS over TLS (DoT) encrypt DNS queries to prevent ISP snooping and man-in-the-middle attacks.

**Split-horizon DNS** returns different answers based on the client's network (internal vs. external IP) — common for private services.`,
      },
      {
        title: "Load Balancing",
        order: 3,
        body: `A **load balancer** distributes incoming traffic across a pool of backend servers to maximize throughput, minimize latency, and avoid overloading any single server.

**Algorithms**:
- *Round Robin* — each request goes to the next server in sequence. Simple, no state. Good when servers are homogeneous.
- *Weighted Round Robin* — servers with more capacity get proportionally more traffic.
- *Least Connections* — route to the server with the fewest active connections. Good for long-lived connections (WebSockets, gRPC).
- *IP Hash / Consistent Hashing* — same client IP always routes to the same server (session affinity). Consistent hashing minimizes reshuffling when servers are added/removed.
- *Random with Power of Two Choices* — pick two random servers, choose the less loaded. Better than pure random, avoids thundering-herd on least-connections.

**L4 vs L7**:
- *L4 (TCP/UDP)* — routes based on IP/port only. Very fast, low overhead, no TLS termination. Cannot route by URL path or headers. Example: AWS NLB, HAProxy TCP mode.
- *L7 (HTTP/HTTPS)* — routes based on HTTP headers, URL, cookies. Enables A/B routing, canary deploys, content-based routing. Terminates TLS. Example: Nginx, AWS ALB, Envoy.

**Health checks** — LBs periodically probe backends (HTTP GET /health or TCP connect). Failed backends are removed from rotation.

**Common tools**: Nginx, HAProxy, Envoy (service mesh sidecar), AWS ALB/NLB, Cloudflare.`,
      },
    ],
    qna: [
      {
        question: "What happens when you type a URL in the browser and press Enter?",
        order: 0,
        answer: `A high-level walkthrough (great for interviews — expand each step as needed):

1. **URL parsing** — the browser parses the scheme (https), host (example.com), path (/page), query string, and fragment.
2. **HSTS check** — if the host is in the browser's HSTS preload list, HTTP is upgraded to HTTPS immediately.
3. **DNS resolution** — browser cache → OS cache → /etc/hosts → recursive resolver → authoritative NS → returns IP address.
4. **TCP connection** — 3-way handshake with the server IP on port 443.
5. **TLS handshake** — negotiate cipher suite, exchange keys (ECDHE), verify server certificate. Result: encrypted channel.
6. **HTTP request** — browser sends GET /page HTTP/2 with headers (Host, Cookie, Accept-Encoding…).
7. **Server processing** — web server (Nginx) receives the request, routes to the app server, which queries DB/cache and generates a response.
8. **HTTP response** — status 200, Content-Type: text/html, body (possibly compressed with gzip/br).
9. **Rendering** — browser parses HTML → builds DOM. Parses CSS → CSSOM. Constructs render tree → layout → paint. JavaScript is fetched, parsed, executed. Subresources (images, fonts, scripts) trigger additional DNS+TCP+HTTP cycles.
10. **Page interactive** — DOMContentLoaded fires when HTML+scripts are parsed; load fires when all subresources are fetched.`,
      },
      {
        question: "What is the difference between a CDN and a load balancer?",
        order: 1,
        answer: `**Load balancer** — sits in front of your origin servers in your data center or cloud region. Distributes traffic among a pool of identical application instances. Operates within one location. Handles failover, health checks, SSL termination, and sticky sessions. Does not cache content.

**CDN (Content Delivery Network)** — a globally distributed network of *edge servers* (PoPs — Points of Presence) that cache static and semi-static content close to end users. Reduces latency by serving from the nearest edge instead of the origin. Also protects the origin from traffic spikes and DDoS.

Key differences:
| | Load Balancer | CDN |
|---|---|---|
| Location | Single region | Global (100s of PoPs) |
| Purpose | Distribute load across backends | Cache + serve content near users |
| Caching | No | Yes (TTL-based) |
| Dynamic content | Yes | Partial (edge functions) |
| Examples | Nginx, AWS ALB, HAProxy | Cloudflare, AWS CloudFront, Fastly |

They are complementary: CDN edges handle cacheable requests; cache misses hit the origin through a load balancer.`,
      },
      {
        question: "What is the difference between long polling, SSE, and WebSockets?",
        order: 2,
        answer: `All three enable the server to push data to the client, but with different trade-offs:

**Long Polling** — client makes an HTTP request; server holds it open until data is available or a timeout occurs. Client immediately sends another request. Works over standard HTTP/1.1. Pros: simple, works through all proxies. Cons: high latency (new request per message), not truly bidirectional, wasteful for high-frequency updates.

**Server-Sent Events (SSE)** — a long-lived HTTP/1.1 or HTTP/2 response with Content-Type: text/event-stream. Server pushes newline-delimited events over this stream. Client uses the EventSource API (auto-reconnects). Pros: native browser support, works through proxies, HTTP/2 multiplexing makes it efficient. Cons: server → client only (unidirectional); client must use separate HTTP requests to send data.

**WebSockets** — full-duplex, persistent TCP connection. Client sends an HTTP Upgrade request; if accepted, the connection is handed off to the WebSocket protocol. Both sides can send frames at any time. Pros: lowest latency, bidirectional, efficient for high-frequency bidirectional data (chat, gaming, live collaboration). Cons: stateful (harder to scale horizontally without sticky sessions or a pub/sub broker), may not traverse all proxies.

**When to use**:
- Notifications, feeds, live dashboards → SSE (simpler, HTTP-friendly).
- Chat, multiplayer games, collaborative editing → WebSockets.
- Legacy systems or polling of infrequent events → Long polling.`,
      },
    ],
    quiz: [
      {
        question: "What is the difference between an HTTP 301 and a 302 redirect?",
        order: 0,
        options: [
          "301 is temporary; 302 is permanent",
          "301 is permanent; 302 is temporary",
          "Both are permanent but differ in caching behavior",
          "301 redirects the browser; 302 redirects API clients only",
        ],
        correctIndex: 1,
        explanation:
          "HTTP 301 (Moved Permanently) tells browsers and crawlers to permanently update their bookmarks/index to the new URL and cache the redirect indefinitely. HTTP 302 (Found) is a temporary redirect — clients should keep using the original URL for future requests. 301 is used when migrating pages; 302 for temporary A/B testing or login redirects.",
      },
      {
        question: "During a TCP 3-way handshake, what is the purpose of the SYN-ACK packet sent by the server?",
        order: 1,
        options: [
          "It terminates the connection if the server is busy",
          "It acknowledges the client's SYN and sends the server's own SYN to establish bidirectional sequence numbers",
          "It encrypts the connection with TLS",
          "It carries the HTTP request from the server to the client",
        ],
        correctIndex: 1,
        explanation:
          "The SYN-ACK does two things simultaneously: (1) ACK — acknowledges receipt of the client's SYN (incrementing the client's ISN by 1), and (2) SYN — the server sends its own initial sequence number (ISN) so the client can acknowledge it with the final ACK. This establishes reliable, bidirectional sequence tracking before any data is sent.",
      },
      {
        question: "What is the key advantage of HTTP/2 multiplexing over HTTP/1.1?",
        order: 2,
        options: [
          "It encrypts each stream independently with a different key",
          "It allows multiple request/response streams over a single TCP connection without HTTP-level head-of-line blocking",
          "It removes the need for DNS by embedding IP addresses in headers",
          "It compresses the response body using a new algorithm faster than gzip",
        ],
        correctIndex: 1,
        explanation:
          "HTTP/1.1 can only process one request at a time per connection (or requires multiple connections to parallelize). HTTP/2 multiplexing interleaves multiple binary-framed streams on a single TCP connection, eliminating the HTTP-level head-of-line blocking problem. This reduces connection overhead and latency significantly. Note: TCP-level HOL blocking still exists — HTTP/3/QUIC solves that.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIOS DATA
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    title: "API Latency Suddenly Spiked",
    description: `Your Node.js REST API has been running smoothly for months. This morning, the p99 latency jumped from 120 ms to 4.5 seconds. CPU and memory look normal. Database connections are within limits. The spike correlates with a new feature that fetches a user's dashboard — which includes their recent orders, each with associated product details.`,
    difficulty: "MEDIUM",
    order: 1,
    hypotheses: [
      "The database server ran out of disk space, causing writes to block",
      "A third-party payment API the dashboard calls is responding slowly",
      "An N+1 query problem: the code fetches orders in one query, then issues a separate query per order to load product details",
      "A memory leak is causing frequent garbage collection pauses in Node.js",
    ],
    correctIndex: 2,
    explanation: `The root cause is an **N+1 query problem**. The new dashboard endpoint fetches, say, 20 recent orders in one query — then inside a loop, issues a separate \`SELECT * FROM products WHERE id = ?\` for each order. That's 21 database round-trips instead of 1. At 4 ms per query, this adds 80 ms of latency per request. Under load, connection pool exhaustion multiplies the effect.

**How to confirm**: check the database slow query log or an APM tool (Datadog, New Relic). You'll see dozens of identical single-row product queries per API call.

**Fix**: use a JOIN or an \`IN\` clause to fetch all needed products in a single query. In ORMs: Prisma's \`include\`, Sequelize's \`eager loading\`, or Django's \`select_related\`.

**Lesson**: always review the generated SQL when adding new ORM-based queries. Instrument with query count metrics and set alerts for "queries per request" exceeding a threshold.`,
  },
  {
    title: "Database Query Running 10× Slower",
    description: `A PostgreSQL query that lists active subscriptions with their user details was running in ~50 ms for the past 6 months. After the weekend, it takes 500 ms with no change to the query or schema. Row count has only grown by ~5%. The query uses a WHERE clause on an indexed column.`,
    difficulty: "MEDIUM",
    order: 2,
    hypotheses: [
      "Someone dropped the index on the subscriptions table over the weekend",
      "The PostgreSQL auto-vacuum process has not run recently, causing stale table statistics that led the planner to choose a sequential scan instead of the index",
      "A network partition between the app server and database is adding round-trip latency",
      "The query is now hitting a read replica that has replication lag",
    ],
    correctIndex: 1,
    explanation: `The root cause is **stale table statistics** causing the query planner to choose a sequential scan. PostgreSQL's query planner decides between index scan and seq scan based on statistics (row count, column cardinality, value distribution) maintained by auto-vacuum/analyze. If a large batch of rows was inserted/deleted over the weekend and auto-vacuum hasn't run, the planner's row-count estimate may be wildly wrong — leading it to believe a seq scan is cheaper.

**How to confirm**: run \`EXPLAIN (ANALYZE, BUFFERS) <your query>\`. Look for "Seq Scan" on a large table where you expect an "Index Scan". Check \`pg_stat_user_tables\` for \`last_autoanalyze\` and \`n_dead_tup\`.

**Fix**: run \`ANALYZE subscriptions;\` (or \`VACUUM ANALYZE\`) to refresh statistics immediately. Then tune auto-vacuum settings (\`autovacuum_analyze_scale_factor\`) for high-write tables.

**Lesson**: high-write tables need more aggressive auto-vacuum. After large bulk operations, always run ANALYZE. Monitor \`pg_stat_user_tables.n_dead_tup\` and \`last_autoanalyze\`.`,
  },
  {
    title: "Node.js Server Restarting Every 8 Hours",
    description: `Your Node.js WebSocket server (using the 'ws' library) restarts itself every 7–9 hours. PM2 logs show an out-of-memory crash. Memory usage grows linearly from ~150 MB after restart to ~1.5 GB just before the crash. The server handles ~500 concurrent WebSocket connections at peak and drops to ~50 overnight.`,
    difficulty: "HARD",
    order: 3,
    hypotheses: [
      "Node.js has a default 1.5 GB heap limit and the server simply needs more RAM allocated via --max-old-space-size",
      "A Redis pub/sub client is subscribing to a new channel on every WebSocket message but never unsubscribing",
      "Event listeners are attached to the WebSocket connection object on each 'connection' event but are never removed when the socket disconnects, accumulating indefinitely",
      "The application is caching API responses in an unbounded in-memory Map without any eviction policy",
    ],
    correctIndex: 2,
    explanation: `The root cause is an **event listener leak**. Each time a new WebSocket connects, the code attaches listeners (e.g., \`process.on('uncaughtException', handler)\` or \`emitter.on('event', handler)\`) inside the connection handler without removing them when the socket closes. After thousands of connect/disconnect cycles overnight, tens of thousands of stale listener functions are retained in memory, none of which can be garbage-collected because the emitter still holds references.

**How to confirm**: use \`--inspect\` with Chrome DevTools heap snapshot. Compare snapshots before and after 1 hour of traffic. Look for growing counts of listener function objects. Also check \`EventEmitter.listenerCount(emitter, 'event')\` — Node.js emits a MaxListenersExceededWarning at 10+ listeners.

**Fix**: always clean up listeners on disconnect:
\`\`\`js
ws.on('close', () => {
  someEmitter.removeListener('event', handler);
  // or: someEmitter.off('event', handler)
});
\`\`\`
Prefer named function references (not anonymous functions) so you can remove them later.

**Lesson**: any resource acquired in a connection handler (listeners, timers, DB cursors) must be released in the close/disconnect handler. Use tools like clinic.js or 0x to profile Node.js memory leaks in production.`,
  },
  {
    title: "502 Bad Gateway Errors on Long Requests",
    description: `Your application exposes a PDF export endpoint that generates large reports. It works fine in development (no proxy) but in production (behind Nginx), requests that take more than ~60 seconds receive a 502 Bad Gateway error. The Node.js app logs show the export completing successfully at ~70 seconds, but the client already received a 502.`,
    difficulty: "EASY",
    order: 4,
    hypotheses: [
      "The Node.js event loop is blocked during PDF generation, causing a timeout",
      "The Nginx proxy_read_timeout directive is set too low (default 60 s), causing Nginx to close the connection to the upstream before the response is ready",
      "The client browser has a built-in 60-second request timeout that cannot be changed",
      "The SSL certificate is expiring, causing Nginx to reject responses from the upstream",
    ],
    correctIndex: 1,
    explanation: `The root cause is **Nginx's \`proxy_read_timeout\` being too low**. The default is 60 seconds — it defines how long Nginx will wait for the upstream (Node.js) to send a response body. When the PDF export takes 70 seconds, Nginx gives up and returns a 502 to the client, even though Node.js successfully completes the work a few seconds later.

**How to confirm**: compare the Nginx error log timestamp with the Node.js completion log timestamp. You'll see the 502 logged ~60 s after the request started, and the completion log ~10 s later.

**Fix**: increase the timeout in your Nginx location block:
\`\`\`nginx
location /api/export {
    proxy_read_timeout 300s;    # 5 minutes for heavy exports
    proxy_connect_timeout 10s;
    proxy_send_timeout 300s;
}
\`\`\`

**Better long-term fix**: make the export endpoint asynchronous — return a job ID immediately, process in the background, let the client poll or receive a webhook when ready. This avoids timeout issues entirely and improves UX.`,
  },
  {
    title: "Users Getting Charged Twice",
    description: `Your e-commerce platform processes payments via Stripe. You start receiving complaints that some users are charged twice for a single order. The issue occurs sporadically (~0.3% of orders) and seems correlated with high traffic periods. Your payment flow: (1) check if user has sufficient balance/card, (2) create the Stripe charge, (3) debit user's in-app wallet and mark order as paid.`,
    difficulty: "HARD",
    order: 5,
    hypotheses: [
      "Stripe is processing the charge twice due to a bug in their API",
      "The front-end submit button is not disabled after the first click, allowing duplicate form submissions",
      "A TOCTOU (Time-of-Check to Time-of-Use) race condition: two concurrent requests both pass the balance check before either commits the debit, resulting in two charges",
      "The database connection pool is returning stale connections that replay previous queries",
    ],
    correctIndex: 2,
    explanation: `The root cause is a **TOCTOU (Time-of-Check to Time-of-Use) race condition**. Here's the sequence:

1. Request A: reads wallet balance (100 USD) → sufficient ✓
2. Request B: reads wallet balance (100 USD) → sufficient ✓  *(before A committed)*
3. Request A: creates Stripe charge → debits wallet → balance = 0
4. Request B: creates Stripe charge → debits wallet → balance = -100 (double charge!)

Two concurrent requests both pass the balance check before either one commits its debit.

**How to fix** — several approaches:
- **Pessimistic lock**: \`SELECT ... FOR UPDATE\` locks the wallet row; Request B blocks until A commits.
- **Optimistic lock**: Add a \`version\` column. The UPDATE increments version and has a \`WHERE version = :expected\` clause. If 0 rows updated, retry or reject.
- **Idempotency key**: Pass a unique key (order ID) to Stripe. If Stripe receives the same key twice, it returns the existing charge instead of creating a new one. This prevents Stripe-side duplicates regardless of your DB race.
- **Database unique constraint**: Add UNIQUE(order_id) on the charges table so the second insert fails with a constraint violation.

**Best practice**: combine idempotency keys at the payment provider level with pessimistic locking at the DB level for defense in depth.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES DATA
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    title: "Answering Behavioral Questions",
    description: "Structure your stories with impact using the STAR method",
    icon: "⭐",
    order: 1,
    steps: [
      {
        label: "Situation",
        detail:
          "Set the scene concisely — the team size, project context, and the challenge or constraint you were facing. Keep this to 1–2 sentences.",
      },
      {
        label: "Task",
        detail:
          "Clarify your specific responsibility. What were you personally accountable for? Distinguish your role from the team's role.",
      },
      {
        label: "Action",
        detail:
          "This is the most important part — spend 60% of your answer here. Describe the specific steps YOU took. Use 'I' not 'we'. Explain your reasoning and trade-offs.",
      },
      {
        label: "Result",
        detail:
          "Quantify the outcome where possible (latency reduced by 40%, shipped 2 weeks early, reduced churn by 15%). If you can't quantify, describe the qualitative impact.",
      },
    ],
    example: `**Question**: "Tell me about a time you had to deal with a production incident."

**S**: Our payments service went down at 2 AM on Black Friday — 100% of checkouts were failing.

**T**: I was the on-call engineer. My job was to restore service and root-cause the failure.

**A**: I immediately rolled back the deploy from 2 hours earlier. Checkouts resumed in 4 minutes. Then I bisected the diff — found a missing database index on a new query that caused a sequential scan under load, exhausting DB connections.

**R**: Revenue impact was under $8K (vs. estimated $200K if we'd waited for morning). I added the index and wrote a runbook that's prevented 3 similar incidents since.`,
  },
  {
    title: "Explaining Your DSA Approach",
    description: "Walk interviewers through your thinking, not just your code",
    icon: "🧠",
    order: 2,
    steps: [
      {
        label: "Restate the Problem",
        detail:
          "Repeat the problem in your own words and clarify ambiguities. Ask about input size, edge cases (empty array, single element, duplicates, negatives), and expected output format.",
      },
      {
        label: "Discuss Examples",
        detail:
          "Walk through 1–2 concrete examples manually. Include a normal case and an edge case. This builds shared understanding and catches misunderstandings early.",
      },
      {
        label: "State Your Approach",
        detail:
          "Before writing code, verbally describe your algorithm and data structures. State the time and space complexity. Ask if the interviewer wants you to proceed.",
      },
      {
        label: "Code Deliberately",
        detail:
          "Write clean, readable code. Narrate as you go. Don't rush — interviewers prefer clear code with commentary over fast sloppy code.",
      },
      {
        label: "Test & Optimize",
        detail:
          "Trace through your examples with the actual code. Check edge cases. Then discuss if a more optimal solution exists and what the trade-off would be.",
      },
    ],
    example: `**Problem**: "Find the maximum subarray sum."

"So I need to find a contiguous subarray of integers with the largest sum. Let me confirm — can the array be empty? Can all values be negative? Great.

Example: [-2, 1, -3, 4, -1, 2, 1, -5, 4] → the subarray [4,-1,2,1] has sum 6.

I'll use Kadane's algorithm: iterate once, tracking the max sum ending at the current element and the global max. O(n) time, O(1) space.

[writes code]

Let me trace through the example… max_current goes: -2, 1, -2, 4, 3, 5, 6, 1, 5. Global max: 6. Correct."`,
  },
  {
    title: "Handling \"I Don't Know\"",
    description: "Turn knowledge gaps into opportunities to show your thinking",
    icon: "🤔",
    order: 3,
    steps: [
      {
        label: "Acknowledge Honestly",
        detail:
          "Don't bluff. Say: \"I haven't worked with X directly, but let me reason through it.\" Interviewers respect honesty and penalize confident wrong answers.",
      },
      {
        label: "Reason from First Principles",
        detail:
          "Use what you do know. Draw analogies to similar systems. \"X sounds similar to Y, which works by... so X might...\" Demonstrate structured thinking, not memorized facts.",
      },
      {
        label: "Ask a Clarifying Question",
        detail:
          "It's OK to ask: \"Can you give me a hint about the domain?\" or \"Is this more related to caching or consistency?\" This shows collaborative problem-solving.",
      },
      {
        label: "Connect to What You Know",
        detail:
          "After reasoning, connect back to your experience: \"In my last project, we faced a similar trade-off and solved it by... I imagine X might use a comparable approach.\"",
      },
    ],
    example: `**Interviewer**: "How does Kafka guarantee exactly-once delivery?"

"I haven't implemented exactly-once Kafka consumers personally, but let me reason through it. Kafka's default is at-least-once — messages can be redelivered after a consumer crash. To get exactly-once, you need idempotent producers (so retries don't duplicate messages) combined with transactional consumers that atomically commit the offset and the downstream write. I believe Kafka 0.11+ added transactions for this. In my work, we achieved exactly-once semantics differently — by using idempotency keys in our database so duplicate messages were no-ops. Is the Kafka transactional API what you had in mind?"`,
  },
  {
    title: "Structuring a System Design Interview",
    description: "Lead the interviewer through a 45-minute design session with confidence",
    icon: "🏗️",
    order: 4,
    steps: [
      {
        label: "Clarify Requirements (5 min)",
        detail:
          "Ask about functional requirements (what features?), non-functional requirements (scale, latency, availability, consistency), and constraints (existing tech, budget, timeline). Write them down visibly.",
      },
      {
        label: "Estimate Scale (3 min)",
        detail:
          "Back-of-envelope: DAU, read/write ratio, storage per year, bandwidth. This drives all architectural decisions. Round generously and state assumptions.",
      },
      {
        label: "High-Level Design (10 min)",
        detail:
          "Draw the major components: clients, API gateway, services, databases, caches, queues, CDN. Show data flow. Don't over-engineer — get agreement on the structure before detailing.",
      },
      {
        label: "Deep Dive (20 min)",
        detail:
          "The interviewer will direct focus areas. Common: DB schema, API design, caching strategy, consistency model, a specific algorithm. Show depth and trade-off awareness.",
      },
      {
        label: "Identify Bottlenecks & Iterate (7 min)",
        detail:
          "Proactively call out SPOFs, hot partitions, and scalability limits. Propose solutions: read replicas, sharding, circuit breakers, rate limiting, async queues. Show you can think beyond the happy path.",
      },
    ],
    example: `**System**: "Design a URL shortener like bit.ly"

**Clarify**: 100M URLs/day created, 10B redirects/day (100:1 read:write). Availability > consistency. Short codes must be unique, 7 chars. Analytics (click counts) optional scope.

**Estimate**: 100M writes/day ≈ 1200 writes/s. 10B reads/day ≈ 115K reads/s. Storage: 500 bytes/URL × 100M/day × 365 = ~18 TB/year.

**HLD**: Client → CDN (cache hot short codes) → API servers → short code generator → write to PostgreSQL. Redirects: CDN hit → API → Redis cache → DB fallback.

**Deep dive**: Short code generation — base62 encode a distributed counter (Snowflake ID) → 7-char unique codes, no collision. Redirect latency — cache hit in Redis < 1 ms. DB: index on short_code.

**Bottlenecks**: Redis is a SPOF → Redis Cluster with replicas. Counter service → distributed counter with range allocation per app instance.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED RUNNER
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Engineering Fundamentals...");

  // ── Topics ──────────────────────────────────────────────────────────────────
  let topicCount = 0;
  for (const { concepts, qna, quiz, ...topicData } of TOPICS) {
    const topic = await prisma.fundamentalTopic.upsert({
      where: { title: topicData.title },
      create: topicData,
      update: topicData,
    });

    // Clean-re-seed nested relations
    await prisma.topicConcept.deleteMany({ where: { topicId: topic.id } });
    await prisma.topicQnA.deleteMany({ where: { topicId: topic.id } });
    await prisma.topicQuiz.deleteMany({ where: { topicId: topic.id } });

    await prisma.topicConcept.createMany({
      data: concepts.map((c) => ({ ...c, topicId: topic.id })),
    });
    await prisma.topicQnA.createMany({
      data: qna.map((q) => ({ ...q, topicId: topic.id })),
    });
    await prisma.topicQuiz.createMany({
      data: quiz.map((q) => ({ ...q, topicId: topic.id })),
    });

    topicCount++;
  }

  // ── Scenarios ───────────────────────────────────────────────────────────────
  let scenarioCount = 0;
  for (const scenarioData of SCENARIOS) {
    await prisma.debugScenario.upsert({
      where: { title: scenarioData.title },
      create: scenarioData,
      update: scenarioData,
    });
    scenarioCount++;
  }

  // ── Templates ───────────────────────────────────────────────────────────────
  let templateCount = 0;
  for (const templateData of TEMPLATES) {
    await prisma.commTemplate.upsert({
      where: { title: templateData.title },
      create: templateData,
      update: templateData,
    });
    templateCount++;
  }

  console.log(
    `✅ Seeded: ${topicCount} topics, ${scenarioCount} scenarios, ${templateCount} templates`
  );
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

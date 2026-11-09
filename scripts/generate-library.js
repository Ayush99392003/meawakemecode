import fs from "node:fs";
import path from "node:path";

export const libraryPages = [
  // OS: Processes vs Threads
  {
    slug: "os/processes-vs-threads",
    section: "os",
    title: "Processes vs Threads: Memory, Context Switching & Concurrency",
    orderIndex: 1,
    tags: ["OS", "Concurrency", "Memory"],
    readTimeMinutes: 8,
    content: `# Processes vs Threads

## Fundamental Differences
- **Process**: An executing instance of a program with its own dedicated virtual address space (code, data, heap, stack), file descriptors, and OS resources. Processes are isolated from each other by the MMU (Memory Management Unit).
- **Thread**: The smallest unit of CPU scheduling within a process. Multiple threads of the same process share the process's code section, data section, heap, and open file descriptors, but each thread maintains its own private Program Counter (PC), registers, and call stack.

## Context Switching Overhead
Context switching between processes requires saving CPU registers, switching memory page tables (CR3 register on x86), and invalidating the Translation Lookaside Buffer (TLB), which incurs heavy cache misses. Thread context switching within the same process avoids page table invalidation and TLB flushing, making it significantly faster.
`,
    interviewQuestions: [
      {
        q: "Why is context switching between threads faster than between processes?",
        a: "Threads of the same process share the same virtual address space, so the OS does not need to switch page tables or flush the CPU Translation Lookaside Buffer (TLB). Only registers, program counter, and stack pointer must be swapped."
      },
      {
        q: "What is a Zombie Process vs an Orphan Process?",
        a: "A Zombie process has terminated execution, but its exit status remains in the process table because its parent hasn't called wait(). An Orphan process continues running after its parent process has terminated; it is adopted by init/systemd (PID 1)."
      }
    ]
  },

  // OS: Deadlocks
  {
    slug: "os/deadlocks",
    section: "os",
    title: "Deadlocks: Necessary Conditions, Prevention & Banker's Algorithm",
    orderIndex: 2,
    tags: ["OS", "Synchronization", "Concurrency"],
    readTimeMinutes: 9,
    content: `# Deadlocks in Operating Systems

A deadlock occurs when a set of concurrent processes are blocked indefinitely because each process holds a resource and waits for another resource held by another process in the set.

## The 4 Necessary Coffman Conditions
1. **Mutual Exclusion**: At least one resource must be held in non-shareable mode.
2. **Hold and Wait**: A process holds at least one resource and is waiting to acquire additional resources held by other processes.
3. **No Preemption**: Resources cannot be forcibly revoked; a process must release resources voluntarily.
4. **Circular Wait**: A closed chain of processes exists such that P[0] waits for P[1], P[1] waits for P[2], ..., and P[n] waits for P[0].

All four conditions must hold simultaneously for a deadlock to exist. Breaking any single condition prevents deadlock entirely.
`,
    interviewQuestions: [
      {
        q: "How does resource ordering prevent circular wait?",
        a: "Assign a global total ordering to all resources (e.g. 1 to K) and enforce that every process can only request resources in strictly ascending numerical order. This mathematically prevents any circular dependency."
      },
      {
        q: "What is Banker's Algorithm?",
        a: "A deadlock avoidance algorithm that tests for safety by simulating the allocation of predetermined maximum possible amounts of all resources, before deciding whether allocation should be allowed."
      }
    ]
  },

  // DBMS: ACID & Transactions
  {
    slug: "dbms/acid-properties",
    section: "dbms",
    title: "ACID Properties, Isolation Levels & Concurrency Control",
    orderIndex: 1,
    tags: ["DBMS", "Transactions", "SQL"],
    readTimeMinutes: 10,
    content: `# ACID Properties & Isolation Levels

## ACID Definition
- **Atomicity**: All operations in a transaction succeed completely or are rolled back completely ('all-or-nothing'). Implemented via Write-Ahead Logging (WAL) or undo logs.
- **Consistency**: Database transitions from one valid state to another, respecting all constraints, cascades, and triggers.
- **Isolation**: Concurrent transactions execute without interfering with each other's intermediate state.
- **Durability**: Once a transaction commits, its changes survive system crashes and power failures. Implemented via Redo logs / WAL flushed to disk.

## ANSI SQL Isolation Levels
1. **Read Uncommitted**: Suffers from Dirty Reads.
2. **Read Committed**: Solves Dirty Reads; suffers from Non-Repeatable Reads.
3. **Repeatable Read**: Solves Non-Repeatable Reads; can suffer from Phantom Reads (unless MVCC / Gap Locks used, like InnoDB).
4. **Serializable**: Full serial execution guarantee using Two-Phase Locking (2PL) or Strict Serializable Snapshot Isolation (SSI).
`,
    interviewQuestions: [
      {
        q: "What is the difference between Dirty Read and Phantom Read?",
        a: "A Dirty Read occurs when a transaction reads uncommitted changes made by another transaction that later rolls back. A Phantom Read occurs when a transaction executes a query returning a set of rows satisfying a condition, and a concurrent transaction inserts new matching rows and commits, changing the row count upon re-execution."
      },
      {
        q: "How does Write-Ahead Logging (WAL) ensure durability?",
        a: "WAL mandates that before any data page is modified and written to disk, the corresponding log entry recording the change must be appended to non-volatile disk storage. If a crash occurs, the database replays unwritten changes from the log."
      }
    ]
  },

  // Computer Networks: TCP vs UDP
  {
    slug: "cn/tcp-vs-udp",
    section: "cn",
    title: "TCP vs UDP: Handshake, Flow Control & Congestion Control",
    orderIndex: 1,
    tags: ["CN", "Networking", "Protocols"],
    readTimeMinutes: 9,
    content: `# TCP vs UDP

## Transport Layer Comparison
- **TCP (Transmission Control Protocol)**:
  - Connection-oriented (3-way handshake SYN -> SYN-ACK -> ACK).
  - Reliable: guarantees delivery via sequence numbers, cumulative ACKs, and retransmissions.
  - In-order byte stream: packets arriving out of order are buffered and assembled sequentially.
  - Flow control: sliding window mechanism avoids overwhelming the receiver.
  - Congestion control: AIMD, Slow Start, Fast Retransmit, and Fast Recovery prevent network saturation.
- **UDP (User Datagram Protocol)**:
  - Connectionless: sends packets without setup delay.
  - Unreliable & Out-of-order: fire-and-forget; no acknowledgements or retransmissions.
  - Lightweight 8-byte header (vs TCP's minimum 20-byte header).
  - Used in real-time gaming, DNS, live video streaming, and modern HTTP/3 (QUIC).
`,
    interviewQuestions: [
      {
        q: "Explain the TCP 3-Way Handshake and 4-Way Teardown.",
        a: "Handshake: Client sends SYN(seq=x); Server replies SYN(seq=y)+ACK(x+1); Client sends ACK(y+1). Teardown: Client sends FIN; Server replies ACK; Server sends FIN; Client replies ACK and enters TIME_WAIT (2*MSL) to ensure server received the ACK."
      },
      {
        q: "What is Head-of-Line (HoL) Blocking and how does HTTP/3 solve it?",
        a: "In TCP, if a single packet is lost, all subsequent packets must wait in the buffer until retransmission arrives, blocking all multiplexed streams. HTTP/3 runs over UDP with QUIC, where each stream is tracked independently, eliminating transport-level HoL blocking."
      }
    ]
  },

  // System Design: URL Shortener
  {
    slug: "system_design/url-shortener",
    section: "system_design",
    title: "System Design: Scalable URL Shortener (TinyURL)",
    orderIndex: 1,
    tags: ["System Design", "Scalability", "Architecture"],
    readTimeMinutes: 12,
    content: `# System Design: URL Shortener (TinyURL)

## 1. Requirements & Scale Estimation
- **Traffic**: 100 Million URLs created / month. Read:Write ratio is 100:1.
- **Write QPS**: 100M / (30 * 86,400) ≈ 40 writes/sec.
- **Read QPS**: 40 * 100 = 4,000 reads/sec.
- **Storage (5 years)**: 100M * 12 * 5 = 6 Billion URLs. At 500 bytes per URL entry ≈ 3 TB storage total.

## 2. Key Generation Service (KGS)
- A 7-character Base62 string ([a-zA-Z0-9]) provides 62^7 ≈ 3.5 Trillion unique combinations, easily satisfying 6 Billion.
- Rather than hashing URLs and dealing with MD5/SHA256 collisions, use a standalone pre-generated Key Generation Service (KGS) or distributed ID generator (Snowflake/Range allocator). KGS pre-generates random 7-character strings and serves them in O(1) with zero collisions.

## 3. High-Level Architecture
- **Clients** -> **Load Balancer** -> **API Web Servers** -> **Redis Cache** -> **NoSQL Database (MongoDB / Cassandra)**.
- Read requests query Redis first; on cache miss, query Cassandra and write to Redis with LRU eviction.
- Return HTTP 301 (Permanent Redirect - browser caches response) vs HTTP 302 (Temporary Redirect - allows server to track click analytics).
`,
    interviewQuestions: [
      {
        q: "When should you return HTTP 301 vs HTTP 302 in a URL shortener?",
        a: "HTTP 301 (Permanent Redirect) instructs browsers to cache the destination URL locally, eliminating load on our servers for repeat visits. HTTP 302 (Temporary Redirect) forces the browser to hit our server on every redirect, which is essential if you need accurate per-click tracking and analytics."
      },
      {
        q: "How do you handle hash collisions if using Base62 encoding on MD5?",
        a: "Base62 on MD5 truncates the 128-bit hash to 7 chars, creating collisions. Mitigations: append a sequence number or user ID to the input URL and re-hash, or use a pre-generated key pool (Key Generation Service) to completely eliminate runtime collisions."
      }
    ]
  },

  // System Design: Rate Limiter
  {
    slug: "system_design/rate-limiter",
    section: "system_design",
    title: "System Design: Distributed Rate Limiter",
    orderIndex: 2,
    tags: ["System Design", "Distributed Systems", "Algorithms"],
    readTimeMinutes: 11,
    content: `# System Design: Distributed Rate Limiter

## 1. Algorithms
1. **Token Bucket**: Fixed capacity bucket where tokens refill at a steady rate. Requests consume a token. Allows bursts up to bucket capacity.
2. **Leaky Bucket**: Requests enter a FIFO queue and leak out at a constant rate. Smooths bursts into a steady output rate.
3. **Fixed Window Counter**: Divides time into fixed windows (e.g., 1 minute) and tracks count. Suffers from the boundary burst issue (2x limit across window boundaries).
4. **Sliding Window Log**: Stores timestamps in a sorted set (e.g., Redis ZSET). Perfectly accurate, but high memory footprint.
5. **Sliding Window Counter**: Blends previous window count with current window count using weight: \`count = prev_count * (1 - time_ratio) + curr_count\`. Excellent trade-off between memory and accuracy.

## 2. Distributed Architecture with Redis
- Centralized counter stored in Redis using atomic Lua scripts or \`MULTI/EXEC\` to avoid race conditions.
- Headers returned:
  - \`X-Ratelimit-Limit\`: Maximum requests allowed in the period.
  - \`X-Ratelimit-Remaining\`: Remaining requests in current window.
  - \`X-Ratelimit-Retry-After\`: Seconds to wait before retrying (sent with HTTP 429 Too Many Requests).
`,
    interviewQuestions: [
      {
        q: "How do you prevent race conditions in a distributed rate limiter?",
        a: "Use Redis Lua scripts (which execute atomically in Redis's single-threaded event loop) or Redis pipeline transactions with WATCH. This guarantees the read-check-increment operation occurs atomically without concurrency race conditions."
      },
      {
        q: "What is the boundary burst issue in Fixed Window Counter?",
        a: "If a user sends the full quota in the last 10 seconds of Window 1, and sends another full quota in the first 10 seconds of Window 2, they successfully executed 2x the allowed requests within a 20-second rolling duration."
      }
    ]
  }
];

const outDir = path.resolve("./data/library");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, "library_catalog.json"), JSON.stringify(libraryPages, null, 2));
console.log(`Successfully generated ${libraryPages.length} core library pages into data/library/library_catalog.json`);


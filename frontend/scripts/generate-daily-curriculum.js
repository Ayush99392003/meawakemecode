const fs = require('fs');
const path = require('path');

// 30 Days Master Topics Definition
const syllabus = [
  {
    day: 1,
    dsaTheme: 'Arrays & Hash Maps',
    csTitle: 'Virtual Memory, Address Translation & Page Faults',
    csDomain: 'Operating Systems',
    csSummary: 'How CPU MMU translates virtual addresses to physical RAM, TLB caching, page table hierarchies, and the precise anatomy of page faults and swap.',
    csMentalModel: 'Virtual memory isolates processes into identical 64-bit flat address spaces; the MMU and kernel map virtual pages (typically 4KB) to physical frames on demand.',
    csDetails: `### Process Memory Hierarchy & Address Translation

Every modern OS (Linux, macOS, Windows) provides each user process with its own private virtual address space. On 64-bit x86_64 architectures, canonical addresses use 48 bits (256 TB user space), organized into standardized segments:

1. **Text Segment (Code)**: Read-only, executable machine instructions.
2. **Data & BSS Segments**: Initialized global/static variables (\`.data\`) and zero-initialized variables (\`.bss\`).
3. **Heap**: Dynamically allocated memory via \`brk\` / \`sbrk\` or memory-mapped regions via \`mmap\`. Grows upwards towards higher memory addresses.
4. **Memory Mapped Region**: Shared libraries (\`libc.so\`), shared memory blocks, and file backings.
5. **Stack**: Thread execution frames, local variables, return addresses. Grows downwards.

### The Page Fault Interrupt Lifecycle

When the CPU attempts to dereference an address:
1. **TLB Check**: The Translation Lookaside Buffer (L1 MMU cache) is queried for the Virtual Page Number (VPN). If cached (TLB Hit), translation takes $\\sim 1\\text{ ns}$.
2. **Page Table Walk**: On a TLB Miss, hardware page table walkers traverse the multi-level page table (CR3 register $\\rightarrow$ PML4 $\\rightarrow$ PDPT $\\rightarrow$ PD $\\rightarrow$ PT).
3. **Trap Handler Execution**: If the Valid/Present bit is 0, the CPU triggers Interrupt Vector 14 (\`#PF\` Page Fault Exception). The kernel receives the faulting address in register \`CR2\` and an error code.
4. **Frame Allocation & Disk I/O**: If valid virtual memory, the kernel allocates a physical frame (from free page lists), fetches the disk block (from backing store or swap), updates the PTE, sets Present=1, and restarts the faulting instruction.`,
    csFailureCase: 'Major Page Fault Spikes in High-Throughput Java/Node.js servers: When physical RAM is exhausted and the Linux kernel starts swapping heap pages to disk, page fault latency jumps from nanoseconds to tens of milliseconds (disk I/O wait), causing sudden thread pool starvation and massive p99 latency spikes.',
    csInterviewQuestions: [
      {
        q: 'What is the exact distinction between a Minor (Soft) and Major (Hard) Page Fault?',
        a: 'A minor page fault occurs when the target page is already in physical RAM (e.g. allocated by another process, or lazily mapped via copy-on-write during fork), requiring only a page table update without disk I/O. A major page fault requires blocking disk or swap I/O to read page bytes into physical memory.'
      },
      {
        q: 'Why do multi-level page tables save memory compared to a single flat page table?',
        a: 'A single flat 64-bit page table would require petabytes just to store PTEs. Multi-level tables allow the OS to allocate page table directories lazily; unallocated or sparse virtual memory regions do not require inner page tables to be instantiated in physical RAM.'
      }
    ],
    sdTitle: 'System Design Foundations: Latency, Throughput & CAP/PACELC',
    sdSummary: 'Foundational distributed systems principles: latency numbers every engineer should know, throughput bottlenecks, CAP theorem, and PACELC in real-world high availability.',
    sdArchitecture: `### Latency Numbers Every Distributed Systems Engineer Must Know

| Operation | Latency | Real-World Equivalent Scale |
| :--- | :--- | :--- |
| L1 Cache Reference | $0.5\\text{ ns}$ | 1 heartbeat |
| Branch Mispredict | $5\\text{ ns}$ | 10 heartbeats |
| L2 Cache Reference | $7\\text{ ns}$ | 14 heartbeats |
| Mutex Lock / Unlock | $25\\text{ ns}$ | 50 heartbeats |
| Main Memory (RAM) Access | $100\\text{ ns}$ | 3.3 minutes |
| Read 1 MB sequentially from Memory | $3,000\\text{ ns}$ ($3\\;\\mu\\text{s}$) | 1.5 hours |
| NVMe SSD Random Read | $10,000\\text{ ns}$ ($10\\;\\mu\\text{s}$) | 5 hours |
| SSD 1 MB Sequential Read | $50,000\\text{ ns}$ ($50\\;\\mu\\text{s}$) | 1.1 days |
| Round trip within same datacenter | $500,000\\text{ ns}$ ($0.5\\text{ ms}$) | 11.5 days |
| Read 1 MB sequentially from SSD | $1,000,000\\text{ ns}$ ($1\\text{ ms}$) | 23 days |
| Disk Seek (HDD) | $10,000,000\\text{ ns}$ ($10\\text{ ms}$) | 7.6 months |
| Send packet CA $\\rightarrow$ Netherlands $\\rightarrow$ CA | $150,000,000\\text{ ns}$ ($150\\text{ ms}$) | 9.5 years |

### CAP vs PACELC Theorem
The traditional CAP theorem states that under network partitions ($P$), a distributed system must choose between Consistency ($C$) and Availability ($A$).

**PACELC extends this to normal operations**:
- **If Partition ($P$)**: Choose between Availability ($A$) and Consistency ($C$).
- **Else ($E$)**: Choose between Latency ($L$) and Consistency ($C$).

Examples:
- **MongoDB / DynamoDB**: PA/EL (Partition $\\rightarrow$ Availability, Else $\\rightarrow$ Latency)
- **Google Spanner / CockroachDB**: PC/EC (Partition $\\rightarrow$ Consistency, Else $\\rightarrow$ Consistency via TrueTime/Paxos)`,
    sdTradeoffs: 'Prioritizing strong linearizability requires cross-datacenter quorum round-trips ($>100\\text{ ms}$ latency), whereas choosing eventual consistency allows single-datacenter local reads ($<2\\text{ ms}$ latency) with the risk of stale reads.',
    sdInterviewQuestions: [
      {
        q: 'Why does the CAP theorem apply strictly only when a network partition actually occurs?',
        a: 'In steady state without network partitions, both consistency and availability can be satisfied simultaneously. The tradeoff during normal operation is between Latency and Consistency (as formalized by Abadi\'s PACELC theorem).'
      },
      {
        q: 'What is the operational difference between p95, p99, and p99.9 latency in SLA monitoring?',
        a: 'While p50 represents the typical user experience, p99.9 represents the slowest 1 in 1,000 requests. In modern microservice fan-out architectures where one client request triggers 100 internal RPCs, a high p99 latency directly degrades 63% of all end-user requests.'
      }
    ]
  },
  {
    day: 2,
    dsaTheme: 'Two Pointers',
    csTitle: 'Processes vs Threads: Memory, TCB/PCB & Context Switching',
    csDomain: 'Operating Systems',
    csSummary: 'Detailed internals of Linux task_struct, memory sharing between threads vs processes, clone() flags, and the cost of register saves and TLB flushes during context switching.',
    csMentalModel: 'A process is an isolated resource container (private page table, file descriptors, credentials); a thread is an execution unit (registers, program counter, private stack) sharing the process address space.',
    csDetails: `### Process Control Block (PCB) vs Thread Control Block (TCB)

In the Linux kernel, both processes and threads are represented by the unified struct \`task_struct\`.
- When creating a process via \`fork()\`, a copy-on-write duplicate of the page tables and file descriptor tables is generated.
- When creating a thread via \`pthread_create()\` (which invokes \`clone()\` system call), flags \`CLONE_VM\`, \`CLONE_FS\`, \`CLONE_FILES\`, and \`CLONE_SIGHAND\` are passed, instructing the kernel to share the virtual memory pointer (\`mm_struct\`) and file table.

### Anatomy of Context Switch Overhead
1. **Thread Switch within Same Process**:
   - Save CPU registers (rax, rbx, rsp, rip, etc.) into the outgoing thread's kernel stack/TCB.
   - Restore register state from incoming thread's TCB.
   - **Cost**: $\\sim 1 - 2\\;\\mu\\text{s}$. Memory translation tables (CR3 register) remain untouched.
2. **Process Switch across Different Processes**:
   - Save registers and change CPU stack pointer.
   - Reload register \`CR3\` with the physical base address of the new process's PML4 page table.
   - **Invalidation of TLB**: Changing CR3 invalidates non-global TLB entries. Subsequent memory reads incur major TLB misses, slowing instructions down for hundreds of cycles.
   - **Cost**: $\\sim 3 - 10\\;\\mu\\text{s}$ direct overhead plus severe cache pollution.`,
    csFailureCase: 'Context-Switching Thrashing: Spawning 10,000 OS native threads in a web server causes the CPU to spend over 70% of clock cycles merely executing kernel scheduler context switches instead of servicing HTTP traffic, collapsing overall throughput.',
    csInterviewQuestions: [
      {
        q: 'Why do Goroutines or Kotlin Coroutines have less context switch overhead than OS threads?',
        a: 'Coroutines run in user space (M:N scheduling model) with tiny initial stacks (~2KB vs ~2-8MB OS thread stack), and switching between them does not require a ring 0 kernel privilege transition or TLB flush.'
      },
      {
        q: 'What happens to child process file descriptors upon fork()?',
        a: 'The child gets a copy of the parent\'s file descriptor table, but both descriptors point to the same underlying open file table entry in the kernel, sharing file offsets and read/write positions.'
      }
    ],
    sdTitle: 'Design a Scalable URL Shortener (TinyURL)',
    sdSummary: 'Architecture for 100M new URLs/month and 1B reads/day: Base62 encoding vs MD5 hash truncation, Key Generation Service (KGS), and Redis caching.',
    sdArchitecture: `### System Scale & Estimation
- **Writes**: 100M URLs / month $\\approx 40\\text{ URLs/second}$ (Peak $\\approx 200\\text{ writes/s}$).
- **Reads**: 1B URLs / month $\\approx 400\\text{ reads/second}$ (Peak $\\approx 2,000\\text{ reads/s}$).
- **Read-to-Write Ratio**: 10:1 (Read heavy).
- **Storage for 5 Years**: $100\\text{M} \\times 12 \\times 5 = 6\\text{ Billion URLs}$. At 500 bytes per record $\\approx 3\\text{ TB}$.

### Key Generation Service (KGS) Architecture
Instead of computing hashes at runtime (which causes hash collisions and requires DB lookups to resolve):
1. An offline **Key Generation Service (KGS)** pre-generates 7-character unique alphanumeric strings using Base62 characters (\`[a-zA-Z0-9]\`).
2. $62^7 \\approx 3.52\\text{ Trillion}$ combinations, plenty for 6 billion URLs.
3. KGS stores pre-generated keys in two tables: \`unused_keys\` and \`used_keys\`.
4. When a new short URL request arrives, the API Gateway pops an unused key from an in-memory buffer, eliminating locking and collision detection.

### Read Path Optimization
1. User requests \`GET https://short.link/xyz789\`.
2. ALB routes to Application Server.
3. Check **Redis Cache** (holds 20% of hot URLs via LRU eviction policy).
4. If Cache Hit: Return \`302 Found\` (or \`301 Moved Permanently\`) with \`Location: original_url\`.
5. If Cache Miss: Query PostgreSQL / Cassandra, populate Redis, and return redirect.`,
    sdTradeoffs: 'Returning HTTP 301 caches the redirect in the user browser (saving server bandwidth on future clicks), but HTTP 302 forces requests to hit the server, allowing precise real-time analytics and click tracking.',
    sdInterviewQuestions: [
      {
        q: 'Why is Base62 encoding preferred over Base64 for URL shorteners?',
        a: 'Base64 includes characters "+" and "/" which have reserved meanings in URL query strings and path segments, requiring URL-escaping (%2B, %2F). Base62 uses only alphanumeric characters [0-9a-zA-Z], which are safe across all HTTP clients and browsers.'
      },
      {
        q: 'How do you prevent single points of failure in the Key Generation Service?',
        a: 'KGS runs in active-standby instances with pre-assigned key ranges (e.g. Server 1 dispenses keys with IDs ending in 0-4, Server 2 dispenses 5-9) or uses ZooKeeper/Raft to lease token ranges to workers.'
      }
    ]
  },
  {
    day: 3,
    dsaTheme: 'Sliding Window',
    csTitle: 'CPU Scheduling Algorithms: CFS, Multilevel Feedback & Preemption',
    csDomain: 'Operating Systems',
    csSummary: 'Linux Completely Fair Scheduler (CFS), virtual runtime (vruntime), red-black tree task queues, nice values, and real-time scheduling classes (SCHED_FIFO/RR).',
    csMentalModel: 'CFS tracks each task\'s accumulated virtual runtime (vruntime); the task that has received the least CPU time is picked next from the leftmost node of a red-black tree.',
    csDetails: `### Linux CFS Mechanics & vruntime

In Linux, the Completely Fair Scheduler (CFS) models an ideal multi-tasking CPU on hardware:
1. **Virtual Runtime (\`vruntime\`)**: Measures the amount of CPU execution time a thread has consumed, scaled inversely by its priority (\`nice\` value from -20 to +19).
   $$vruntime += \\Delta exec\\_time \\times \\frac{NICE\\_0\\_LOAD}{task\\_load}$$
   High-priority tasks (negative nice) have large \`task_load\`, so their \`vruntime\` increases slowly, allowing them to run longer.
2. **Red-Black Tree Runqueue**: Runnable tasks are sorted by \`vruntime\`. The CPU always selects the task with the smallest \`vruntime\` ($O(1)$ lookup via cached leftmost pointer).
3. **Latency Target & Granularity**: \`sysctl_sched_latency\` defines the period during which all runnable tasks must run at least once. If too many tasks are runnable, \`sysctl_sched_min_granularity\` enforces a minimum timeslice (e.g. 0.75ms) to prevent context switch thrashing.`,
    csFailureCase: 'Nice-Level Inversion in Mixed Workloads: Running CPU-intensive batch jobs at normal priority alongside latency-sensitive web service threads without proper cgroup scheduling causes batch jobs to monopolize CPU timeslices, degrading API response times.',
    csInterviewQuestions: [
      {
        q: 'What is the purpose of the Completely Fair Scheduler (CFS) red-black tree leftmost pointer cache?',
        a: 'Finding the task with the lowest vruntime in an RB-tree takes O(log N) time, but by caching the leftmost node during tree updates, selecting the next task to run is an O(1) operation.'
      },
      {
        q: 'How does CFS handle I/O-bound processes versus CPU-bound processes?',
        a: 'I/O-bound processes spend most of their time blocked waiting for network or disk. Their vruntime remains stagnant while running processes advance. When an I/O-bound process wakes up, its vruntime is much lower than running tasks, giving it immediate preemption priority.'
      }
    ],
    sdTitle: 'Design a Distributed Rate Limiter',
    sdSummary: 'Architecture for high-throughput API rate limiting: Token Bucket, Leaky Bucket, Sliding Window Log vs Sliding Window Counter, and Redis Lua scripts.',
    sdArchitecture: `### Rate Limiting Algorithms Comparison

1. **Token Bucket**: Tokens added at constant rate $R$. Bursts allowed up to bucket capacity $B$. Simple memory footprint (2 numbers: tokens, lastTimestamp).
2. **Leaky Bucket**: Requests enter queue and leak out at constant rate. Smooths out traffic, but drops requests during spikes.
3. **Sliding Window Log**: Stores timestamps in Redis Sorted Set (ZSET). Accurately calculates count within $[now - window, now]$. High memory consumption.
4. **Sliding Window Counter**: Combines counters from current and previous windows:
   $$Count = Count_{current} + Count_{prev} \\times \\left(1 - \\frac{elapsed}{window}\\right)$$
   Extremely memory efficient (stores only 2 integers) and gives 99.9% accuracy.

### Distributed Redis Architecture
- Use **Redis Cluster** partitioned by \`user_id\` or \`ip_address\`.
- Execute rate check atomically using an embedded **Lua script** to prevent Race Conditions (read-modify-write hazard):
\`\`\`lua
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local current = redis.call('GET', key)
if current and tonumber(current) >= limit then
    return 0
else
    redis.call('INCR', key)
    if not current then redis.call('EXPIRE', key, 60) end
    return 1
end
\`\`\``,
    sdTradeoffs: 'Centralized Redis provides exact global limit enforcement across all app nodes, but adds a 1ms network hop per request. Local in-memory rate limiting has 0ms network latency, but allows $N \\times limit$ requests across $N$ servers.',
    sdInterviewQuestions: [
      {
        q: 'How do you handle rate limiter failure in a mission-critical payment API?',
        a: 'Implement a fail-open circuit breaker. If the Redis rate limiter cluster becomes unreachable or times out (>10ms), the API Gateway logs an alert and allows legitimate traffic through rather than causing total service outage.'
      },
      {
        q: 'What HTTP response headers should a rate limiter return?',
        a: 'X-RateLimit-Limit (max requests allowed in period), X-RateLimit-Remaining (remaining count), and X-RateLimit-Reset (Unix epoch timestamp when window resets), returning HTTP status 429 Too Many Requests.'
      }
    ]
  }
];

// Complete Syllabus generator helper for remaining days 4..30
const csDomains = ['Operating Systems', 'Computer Networks', 'Database Management', 'Distributed Systems & OOP'];

const syllabusFull = [...syllabus];

const remainingTopics = [
  {
    day: 4,
    dsaTheme: 'Prefix Sums & Difference Arrays',
    csTitle: 'Synchronization Primitives: Mutex, Semaphores, Spinlocks & CAS',
    csDomain: 'Operating Systems',
    csSummary: 'Hardware atomic instructions (CMPXCHG), test-and-set, cache line bouncing, futex system call, and lock-free concurrency mechanics.',
    csMentalModel: 'Locks protect shared invariants; futex optimizes performance by spinning in user-space first and only invoking kernel sleep if contention persists.',
    csDetails: `### Hardware Atomics & Compare-And-Swap (CAS)
At the hardware level, atomic operations rely on CPU cache coherency protocols (MESI/MOESI). An atomic instruction like \`CMPXCHG\` on x86 locks the cache line, guaranteeing that no other core can read or modify the cache line simultaneously.

### The Linux Futex (Fast Userspace Mutex)
Traditional POSIX mutexes required a system call into the kernel for every lock/unlock. The Linux \`futex\` splits the path:
1. **Uncontended Case**: An atomic CAS operation updates an integer in user-space memory ($\\sim 10\\text{ ns}$). Zero kernel transitions.
2. **Contended Case**: If CAS fails, the thread invokes \`sys_futex(FUTEX_WAIT)\`, placing the thread onto the kernel's wait queue to sleep until woken by \`sys_futex(FUTEX_WAKE)\`.`,
    csFailureCase: 'Priority Inversion Deadlock: A low-priority thread acquires a mutex; a high-priority thread preempts and spins waiting for the lock, but an intermediate priority thread keeps the low-priority thread from running, starving the high-priority thread.',
    csInterviewQuestions: [
      { q: 'When should a developer use a Spinlock instead of a Mutex?', a: 'Spinlocks should only be used when the critical section is extremely short (< a few nanoseconds) and the thread is running on a multi-core CPU where sleeping and context switching would cost more than briefly spinning.' },
      { q: 'What is the ABA problem in lock-free CAS data structures?', a: 'A memory location changes from A to B and back to A between the read and CAS phases, causing the CAS to succeed despite intermediate state mutations. Resolved using tagged pointers or version counters.' }
    ],
    sdTitle: 'Design a Scalable Web Crawler',
    sdSummary: 'Architecture for scraping 1B web pages/month: URL Frontier, politeness policies, MurmurHash deduplication, and Bloom filters.',
    sdArchitecture: `### High-Level Architecture
1. **URL Frontier**: Manages queued URLs with priority queues and politeness delay per domain.
2. **DNS Resolver Cache**: Local DNS cache to avoid resolving domain names on every fetch.
3. **HTML Fetcher**: Asynchronous HTTP client (e.g. Go goroutines / epoll) respecting \`robots.txt\`.
4. **Content Deduplication**: Compute 64-bit SimHash of rendered DOM; query Bloom filter to skip identical pages.
5. **URL Extractor**: Parses internal links, canonicalizes relative paths, and adds new links to frontier.`,
    sdTradeoffs: 'Politeness vs Crawl Throughput: Strict per-host rate limits (e.g. max 1 request/sec per host) protect target web servers from DDoS, but require sharding the crawler across millions of distinct domains to maintain high aggregate throughput.',
    sdInterviewQuestions: [
      { q: 'How do you detect duplicate web pages efficiently at scale?', a: 'Compute a fingerprint of document content using SimHash or MurmurHash. Check against a distributed Bloom Filter or Redis Bitfield before storing the document in S3.' },
      { q: 'How does the URL Frontier maintain host politeness?', a: 'Use a two-tier queue design: Priority Queues sort URLs by importance, while FIFO Politeness Queues enforce that requests to the same host IP have a minimum elapsed delay.' }
    ]
  },
  {
    day: 5,
    dsaTheme: 'Binary Search on Arrays',
    csTitle: 'Deadlocks: Coffman Conditions, Prevention & Banker\'s Algorithm',
    csDomain: 'Operating Systems',
    csSummary: 'The 4 necessary conditions for deadlock, resource allocation graphs, lock ordering protocols, and deadlock detection via cycle detection.',
    csMentalModel: 'Deadlock occurs if and only if all 4 Coffman conditions hold: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Breaking any one condition guarantees deadlock freedom.',
    csDetails: `### The 4 Coffman Conditions
1. **Mutual Exclusion**: At least one resource must be held in non-shareable mode.
2. **Hold and Wait**: A process holds at least one resource and requests additional resources held by other processes.
3. **No Preemption**: Resources cannot be forcibly taken; only released voluntarily.
4. **Circular Wait**: A closed chain of processes exists where each process holds a resource needed by the next.

### Prevention: Strict Lock Ordering
To eliminate Circular Wait, assign a total ordering $\\mathcal{O}(L_i)$ to all locks in the system. Any thread acquiring multiple locks must acquire them in monotonically increasing order.`,
    csFailureCase: 'Database Deadlock in Payment Transfers: Transaction 1 updates Account A then Account B; Transaction 2 updates Account B then Account A simultaneously. Both block on row-level exclusive locks until the DBMS deadlock detector detects a cycle and aborts one transaction.',
    csInterviewQuestions: [
      { q: 'How does a relational database engine detect and resolve deadlocks?', a: 'The engine maintains a Wait-For Graph (WFG) where nodes are transactions and directed edges represent lock waits. A background thread runs cycle detection; on finding a cycle, it rolls back the transaction with the lowest cost.' },
      { q: 'Why is Banker\'s Algorithm rarely used in general-purpose OS kernels?', a: 'It requires processes to declare their maximum resource claims in advance, which is impossible in dynamic multi-tenant workloads.' }
    ],
    sdTitle: 'Design a Notification Service at Scale',
    sdSummary: 'Architecture for 10M notifications/minute: Push, SMS, Email fanout, Kafka partitioning, and idempotent delivery.',
    sdArchitecture: `### Notification System Flow
1. **API Gateway**: Validates payload and enqueues notification request.
2. **Notification Service**: Validates user notification preferences (DND hours, opt-outs).
3. **Message Queue (Kafka)**: Partitioned by \`user_id\` to guarantee in-order delivery.
4. **Workers**: Worker pools interface with third-party providers (APNs for iOS, FCM for Android, Twilio for SMS, SendGrid for Email).
5. **Dead-Letter Queue (DLQ)**: Failed deliveries after exponential backoff retries are enqueued for manual inspection.`,
    sdTradeoffs: 'At-least-once delivery with idempotency keys is preferred over exactly-once delivery, because exactly-once across external third-party push gateways (Apple APNs) is physically impossible without two-phase commit.',
    sdInterviewQuestions: [
      { q: 'How do you guarantee idempotency in mobile push notifications?', a: 'Assign each event a unique \`event_id\`. Workers check Redis \`SETNX idempotency:event_id 1\` with a 24-hour TTL before sending the push payload.' },
      { q: 'How do you prevent third-party provider outages from bringing down the notification platform?', a: 'Use circuit breakers (Resilience4j) and fallback providers (e.g. switch to AWS SNS if Twilio error rate exceeds 5%).' }
    ]
  },
  {
    day: 6,
    dsaTheme: 'Binary Search on Answer Space',
    csTitle: 'File Systems, Inodes, VFS & Dirty Page Writeback',
    csDomain: 'Operating Systems',
    csSummary: 'Virtual File System (VFS), Inode data structures, dentry cache, page cache, direct I/O (O_DIRECT), and fsync durability semantics.',
    csMentalModel: 'An inode stores metadata and data block pointers, but not the file name. Directory entries (dentries) map file names to inode numbers in a tree hierarchy.',
    csDetails: `### Inode Structure & Storage
An inode contains: file type, file permissions, owner UID/GID, file size, timestamps (atime, mtime, ctime), link count, and block pointers (direct blocks, indirect, double-indirect).

### The Page Cache & fsync()
When writing to a file via standard \`write()\`:
1. The kernel copies data from the user buffer into the kernel **Page Cache** (RAM) and returns immediately ($O(1)$ latency).
2. The page is marked as **Dirty**.
3. Background kernel threads (\`flusher\` / \`kswapd\`) flush dirty pages to disk every \`dirty_writeback_centisecs\` (default 5s).
4. If power fails before the flush, data is lost. Invoking \`fsync(fd)\` forces a hardware cache flush to persistent disk before returning.`,
    csFailureCase: 'Silent Data Loss in Log Engines: Writing transaction logs without calling \`fdatasync()\` results in completed database transactions being lost on sudden server kernel panics because logs resided only in volatile RAM page cache.',
    csInterviewQuestions: [
      { q: 'What is the difference between a Hard Link and a Symbolic (Soft) Link?', a: 'A hard link is a new directory entry pointing directly to the existing inode number (increasing the link count). A symlink is an independent file containing the path string of the target file.' },
      { q: 'What does O_DIRECT flag do when opening a file in Linux?', a: 'It bypasses the kernel page cache entirely, performing direct DMA transfers between user-space memory buffers and the storage controller, used by high-performance database storage engines.' }
    ],
    sdTitle: 'Design a Distributed Key-Value Store',
    sdSummary: 'Architecture modeled after DynamoDB and Cassandra: Consistent Hashing, Vector Clocks, Quorum consensus (W+R>N), and Gossip protocol.',
    sdArchitecture: `### Core Components
1. **Consistent Hash Ring**: Nodes mapped along a 360-degree virtual ring using MD5/MurmurHash. Virtual nodes ensure uniform key distribution across physical servers.
2. **Replication Factor ($N$)**: Key stored on the coordinator node and the next $N-1$ clockwise successor nodes.
3. **Tunable Quorum**: For strong consistency, configure $R + W > N$ (e.g. $N=3, R=2, W=2$).
4. **Anti-Entropy**: Merkle trees compare replicas asynchronously to detect out-of-sync key ranges without transmitting full data over the network.`,
    sdTradeoffs: 'Choosing $W=1, R=1$ maximizes throughput and minimizes latency, but sacrifices read consistency (allowing dirty/stale reads) until background anti-entropy repairs the replicas.',
    sdInterviewQuestions: [
      { q: 'Why are Virtual Nodes essential in Consistent Hashing?', a: 'Without virtual nodes, adding or removing a physical server can lead to non-uniform key distribution (hot spots). Virtual nodes (e.g. 256 per physical server) evenly distribute load across all available hardware.' },
      { q: 'What is the purpose of the Gossip Protocol in Dynamo-style stores?', a: 'It is a decentralized failure-detection protocol where nodes exchange peer membership and heartbeat state every second, reaching consensus on cluster health without a central master.' }
    ]
  },
  {
    day: 7,
    dsaTheme: 'Bit Manipulation & Fast Math',
    csTitle: 'Inter-Process Communication (IPC): Unix Sockets, Shared Memory & Pipes',
    csDomain: 'Operating Systems',
    csSummary: 'Comparison of IPC primitives: Anonymous pipes, Named pipes (FIFOs), Unix Domain Sockets, POSIX Shared Memory (shm), and message queues.',
    csMentalModel: 'Shared memory is the fastest IPC because it avoids kernel memory copying; Unix Domain Sockets provide the best combination of security, stream abstractions, and file descriptor passing.',
    csDetails: `### IPC Mechanisms & Throughput Comparison
1. **Pipes / FIFOs**: Unidirectional byte stream mediated by a kernel buffer (default 64KB). Involves 2 memory copies (user $\\rightarrow$ kernel $\\rightarrow$ user).
2. **Unix Domain Sockets (UDS)**: Bidirectional, packet or stream based. Supports sending credentials and open file descriptors (\`SCM_RIGHTS\`). Bypasses network routing and checksums.
3. **Shared Memory (\`shm_open\`, \`mmap\`)**: Maps the same physical RAM frames into the virtual address spaces of two processes. Zero copies; requires synchronization primitives (semaphores/mutexes) to prevent race conditions.`,
    csFailureCase: 'Broken Pipe (SIGPIPE) Crashes: Writing to a pipe or socket whose reading process has terminated raises \`SIGPIPE\`. Without an explicit signal handler or \`MSG_NOSIGNAL\` flag, the writing process terminates abruptly.',
    csInterviewQuestions: [
      { q: 'Why is Shared Memory faster than Unix Domain Sockets?', a: 'Shared memory allows processes to read and write directly to physical RAM without kernel intervention or data copying, whereas Unix Domain Sockets require copying data through kernel socket buffers.' },
      { q: 'What does SCM_RIGHTS allow over Unix Domain Sockets?', a: 'It allows a process to pass an open file descriptor (e.g. an open network socket) directly to another process, enabling zero-downtime hot reloads in Nginx and Envoy.' }
    ],
    sdTitle: 'Design a Distributed Unique ID Generator',
    sdSummary: 'Generating 64-bit globally unique, roughly time-sorted IDs at 100,000 IDs/second: Twitter Snowflake architecture and clock drift mitigation.',
    sdArchitecture: `### Snowflake 64-bit ID Layout
- **1 bit**: Unused sign bit (always 0).
- **41 bits**: Timestamp in milliseconds since custom epoch ($2^{41} \\approx 69\\text{ years}$).
- **10 bits**: Machine ID / Worker ID ($2^{10} = 1,024\\text{ worker nodes}$).
- **12 bits**: Sequence number per worker ($2^{12} = 4,096\\text{ IDs/ms per worker node}$).
- **Capacity**: $1,024 \\times 4,096 = 4.19\\text{ Million unique IDs/second}$.

### Clock Drift & NTP Jumps
If the server's local clock synchronizes backwards via NTP:
1. Detect condition: If \`currentTimestamp < lastTimestamp\`, refuse to generate IDs.
2. Sleep until clock catches up or throw an exception to fail over to a healthy standby node.`,
    sdTradeoffs: 'UUIDv4 provides decentralized generation without worker coordination, but its 128-bit random size causes severe B+ Tree index fragmentation in relational databases compared to time-ordered 64-bit Snowflake IDs.',
    sdInterviewQuestions: [
      { q: 'Why are 64-bit time-ordered IDs preferred over UUIDv4 for database primary keys?', a: 'UUIDv4 values are completely random, causing inserts into clustered B+ Tree indexes to require random disk page writes and constant page splits. Time-ordered Snowflake IDs append sequentially to the rightmost leaf page.' },
      { q: 'How does Snowflake resolve sequence number overflow in the same millisecond?', a: 'If a worker receives more than 4,096 requests within a single millisecond, it busy-spins until the next millisecond before issuing the next ID.' }
    ]
  },
  {
    day: 8,
    dsaTheme: 'Stacks & Monotonic Stack',
    csTitle: 'OSI & TCP/IP Model: Encapsulation, MTU, MSS & Packet Headers',
    csDomain: 'Computer Networks',
    csSummary: 'Detailed walk from Application layer to Physical: Ethernet frames, IP headers, TCP headers, Maximum Transmission Unit (MTU), and fragmentation hazards.',
    csMentalModel: 'Networking is layered encapsulation: every layer wraps higher-layer data with its own header containing routing and protocol metadata.',
    csDetails: `### Header Overhead & Encapsulation
1. **Ethernet Layer (Data Link)**: 14-byte header (Src MAC, Dst MAC, EtherType) + 4-byte CRC checksum. Standard MTU = 1,500 bytes.
2. **IPv4 Layer (Network)**: 20-byte base header (Src IP, Dst IP, TTL, Protocol, Total Length).
3. **TCP Layer (Transport)**: 20-byte base header (Src Port, Dst Port, Seq Number, Ack Number, Flags, Window Size).
4. **Maximum Segment Size (MSS)**:
   $$MSS = MTU - (IP\\_Header + TCP\\_Header) = 1500 - (20 + 20) = 1,460\\text{ bytes}$$

### IP Fragmentation & Path MTU Discovery (PMTUD)
If a packet exceeds intermediate hop MTU and has the \`DF\` (Don't Fragment) bit set, the router drops the packet and returns an ICMP Type 3 Code 4 (Fragmentation Needed) message, enabling PMTUD.`,
    csFailureCase: 'Black Hole Routers in Cloud VPCs: Misconfigured security firewalls dropping all ICMP traffic prevent PMTUD notifications from reaching the sender, causing TCP connections to hang indefinitely when sending large payloads.',
    csInterviewQuestions: [
      { q: 'What is the exact mathematical relationship between MTU and MSS?', a: 'MSS is the maximum payload a TCP segment can carry, equal to MTU minus the IP header (20 bytes) and TCP header (20 bytes).' },
      { q: 'What happens when an IP packet is fragmented and one fragment is lost in transit?', a: 'The destination reassembly timer expires, and the entire IP datagram must be discarded and retransmitted by the transport layer.' }
    ],
    sdTitle: 'Design Pastebin / Text Storage System',
    sdSummary: 'Architecture for 10M pastes/day: Object Storage (S3), Metadata DB in PostgreSQL/DynamoDB, Pre-signed URLs, and TTL-based background purge.',
    sdArchitecture: `### Architecture Flow
1. **Write Request**: Client uploads text paste $\\rightarrow$ API Gateway generates unique 8-character ID.
2. **Blob Storage**: Text content stored in Amazon S3 / Google Cloud Storage partitioned by \`hash_prefix/id\`.
3. **Metadata Storage**: Save metadata (size, author, expiryTimestamp, S3URL) in DynamoDB.
4. **Read Path**: Fetch from Redis Cache first; on miss, fetch from S3 and write through to Redis.
5. **Purge Cron**: DynamoDB TTL feature automatically deletes expired metadata records; S3 Lifecycle Policies expire objects after $N$ days.`,
    sdTradeoffs: 'Storing raw text in relational database BLOB columns creates massive database table bloat and slows down index scans. Separating metadata (DB) from text blobs (S3) achieves infinite linear scalability.',
    sdInterviewQuestions: [
      { q: 'How do you handle expired pastes without overloading the primary database with DELETE queries?', a: 'Use lazy deletion (check expiry timestamp on read) combined with storage lifecycle rules or database TTL features that handle background purging asynchronously.' },
      { q: 'How do you prevent malicious users from uploading spam or malware to Pastebin?', a: 'Run an asynchronous worker pipeline that consumes newly created paste IDs from Kafka, scans content via machine-learning moderation APIs, and flags or deletes violating records.' }
    ]
  },
  {
    day: 9,
    dsaTheme: 'Queues & Monotonic Deque',
    csTitle: 'TCP Deep-Dive: 3-Way Handshake, Flow Control & TIME_WAIT',
    csDomain: 'Computer Networks',
    csSummary: 'SYN/ACK sequence numbers, SYN flood defenses (SYN cookies), sliding window buffer tuning, TCP states, and the rationale behind TIME_WAIT (2MSL).',
    csMentalModel: 'TCP is a reliable byte-stream abstraction over an unreliable network, maintained via acknowledgments, sliding windows, and congestion control loops.',
    csDetails: `### TCP 3-Way Handshake
1. **Client $\\rightarrow$ Server**: \`SYN\` (Seq = $ISN_C$, Window = $W_C$, MSS = 1460). State: \`SYN_SENT\`.
2. **Server $\\rightarrow$ Client**: \`SYN + ACK\` (Seq = $ISN_S$, Ack = $ISN_C + 1$). State: \`SYN_RCVD\`.
3. **Client $\\rightarrow$ Server**: \`ACK\` (Ack = $ISN_S + 1$). State: \`ESTABLISHED\`.

### Why the TIME_WAIT State (2MSL) Exists
When a socket initiates an active close, it enters \`TIME_WAIT\` for 2 Maximum Segment Lifetimes ($2 \\times 60\\text{s} = 120\\text{s}$):
1. **Ensure Final ACK Delivery**: If the server didn't receive the final ACK, it retransmits \`FIN\`. The client in \`TIME_WAIT\` can resend the ACK.
2. **Prevent Stale Packet Confusion**: Ensures all delayed packets from the old connection die in the network before a new connection reuses the same 4-tuple (SrcIP, SrcPort, DstIP, DstPort).`,
    csFailureCase: 'Ephemeral Port Exhaustion: A microservice opening short-lived HTTP/1.0 connections without keep-alive exhausts all ~60,000 ephemeral ports due to sockets lingering in TIME_WAIT, causing \`EADDRNOTAVAIL\` connection errors.',
    csInterviewQuestions: [
      { q: 'How do SYN Cookies protect against SYN Flood DDoS attacks?', a: 'The server does not allocate a Transmission Control Block (TCB) in RAM upon receiving SYN. Instead, it encodes client connection parameters and a cryptographic hash into the initial sequence number (ISN). When the client ACKs, the server validates the hash and instantiates the connection.' },
      { q: 'What is the Nagle algorithm and why is TCP_NODELAY often enabled in gaming and financial systems?', a: 'Nagle\'s algorithm buffers small outgoing packets until an outstanding ACK arrives to reduce header overhead. TCP_NODELAY disables this buffering, sending packets immediately to minimize latency.' }
    ],
    sdTitle: 'Design a Distributed Message Queue (Apache Kafka)',
    sdSummary: 'Architecture of high-throughput log-based message queues: Topics, Partitions, Consumer Groups, Zero-Copy (sendfile), and ISR replication.',
    sdArchitecture: `### Kafka Architecture Fundamentals
1. **Topic & Partitions**: A topic is sharded into append-only partitions distributed across brokers. Partitions enable horizontal parallelism.
2. **Zero-Copy Architecture**: Kafka uses Linux \`sendfile()\` system call to transfer byte buffers directly from the OS page cache to the network socket descriptor, bypassing user-space copying.
3. **Consumer Groups**: Multiple consumers share a group ID; each partition is consumed by exactly one consumer within the group.
4. **In-Sync Replicas (ISR)**: The leader replica only acknowledges a message after all replicas in the ISR have written it to their local append-only log.`,
    sdTradeoffs: 'Kafka guarantees total ordering only within a single partition, not across multiple partitions. To achieve global ordering, a topic must use a single partition, limiting throughput to a single machine.',
    sdInterviewQuestions: [
      { q: 'How does Kafka achieve millions of messages per second on standard commodity hardware?', a: 'Through sequential disk I/O (which rivals random memory access speed), heavy reliance on the OS Page Cache, batching messages, and zero-copy data transfer via Linux sendfile().' },
      { q: 'What is the difference between at-least-once, at-most-once, and exactly-once processing in Kafka?', a: 'At-most-once commits offsets before processing; at-least-once commits offsets after successful processing (retries may cause duplicates); exactly-once uses Kafka transactional APIs to coordinate writes to both destination topics and consumer offsets atomically.' }
    ]
  },
  {
    day: 10,
    dsaTheme: 'Linked List Patterns',
    csTitle: 'UDP, QUIC & HTTP Evolution: HTTP/1.1 vs HTTP/2 vs HTTP/3',
    csDomain: 'Computer Networks',
    csSummary: 'Evolution of web transport: HTTP/1.1 Head-of-Line blocking, HTTP/2 multiplexed streams, and HTTP/3 over QUIC UDP eliminating transport-layer HoL blocking.',
    csMentalModel: 'HTTP/2 solved application-layer HoL blocking via binary framing; HTTP/3 solved transport-layer HoL blocking by rebuilding reliable streams directly over UDP.',
    csDetails: `### Protocol Comparison Matrix

| Feature | HTTP/1.1 | HTTP/2 | HTTP/3 (QUIC) |
| :--- | :--- | :--- | :--- |
| **Transport Protocol** | TCP | TCP | UDP (QUIC) |
| **Data Framing** | Plaintext ASCII | Binary Frames | Binary Frames |
| **Multiplexing** | No (Pipelining flawed) | Yes (Single TCP stream) | Yes (Independent QUIC streams) |
| **Transport HoL Blocking** | Yes | Yes (1 dropped packet stalls all streams) | **No** (Streams are fully independent) |
| **Connection Setup** | 2-3 RTT (TCP + TLS) | 2-3 RTT (TCP + TLS) | **0-1 RTT** (Combined Handshake) |
| **Connection Migration** | Breaks on IP change | Breaks on IP change | **Preserved via 64-bit Connection ID** |`,
    csFailureCase: 'HTTP/2 Packet Loss Degradation: On mobile cellular networks with 2% packet loss, HTTP/2 performs worse than HTTP/1.1 because a single lost TCP packet stalls the entire multiplexed TCP connection for all active parallel streams.',
    csInterviewQuestions: [
      { q: 'Why does QUIC use UDP instead of creating a brand new transport protocol alongside TCP and UDP?', a: 'Internet middleboxes (NATs, firewalls, routers) drop packets with unrecognized IP protocol numbers ("ossification"). UDP is universally permitted across all public routers and firewalls.' },
      { q: 'How does QUIC support seamless Connection Migration when a mobile device switches from Wi-Fi to 5G?', a: 'QUIC identifies connections using a unique 64-bit Connection ID in the header rather than the IP/Port 4-tuple. When the IP address changes, the Connection ID remains unchanged, avoiding renegotiation.' }
    ],
    sdTitle: 'Design a Real-Time Chat System (WhatsApp / Slack)',
    sdSummary: 'Architecture for 100M daily active users: WebSocket Gateway, Redis Pub/Sub, Cassandra message store, and user presence heartbeat engine.',
    sdArchitecture: `### Real-Time Chat Architecture
1. **WebSocket Gateway**: Maintains persistent, bidirectional TCP connections with active mobile/web clients.
2. **Session Service**: Maps \`user_id \\rightarrow gateway_server_id\` in Redis.
3. **Chat Service**: Handles message routing. When Alice messages Bob:
   - Queries Session Service for Bob\'s active gateway node.
   - If online: Routes message via internal Redis Pub/Sub or gRPC to Bob\'s gateway.
   - If offline: Sends push notification via APNs/FCM and marks as unread.
4. **Message Store (Apache Cassandra)**: High-write throughput NoSQL with partition key \`chat_id\` and clustering key \`timestamp DESC\`.`,
    sdTradeoffs: 'WebSocket connections require stateful servers, making horizontal auto-scaling and zero-downtime rolling deploys complex due to the need for client reconnection logic and connection draining.',
    sdInterviewQuestions: [
      { q: 'Why is Apache Cassandra preferred over PostgreSQL for chat message storage?', a: 'Cassandra offers linear horizontal write scaling, append-optimized LSM-tree storage, and native partition key clustering that allows fetching the latest 50 messages of a conversation in a single contiguous disk read.' },
      { q: 'How do you design a reliable User Presence (Online/Offline) system at scale?', a: 'Clients send a heartbeat ping every 5 seconds over the WebSocket. The server updates a key in Redis with a 15-second TTL. If no heartbeat arrives, the key expires, marking the user offline.' }
    ]
  }
];

// Helper to fill remaining days 11 to 30
syllabusFull.push(...remainingTopics);
const genericTitles = [
  { d: 11, cs: 'DNS Protocol, Resolvers, TTL & Anycast Routing', sd: 'Design a Video Streaming Platform (YouTube/Netflix)' },
  { d: 12, cs: 'TLS 1.3 Handshake, Asymmetric Encryption & PKI', sd: 'Design a Content Delivery Network (CDN)' },
  { d: 13, cs: 'Relational Database Storage: B+ Trees & Buffer Pool', sd: 'Design a Distributed File System (GFS/HDFS)' },
  { d: 14, cs: 'Database ACID, Write-Ahead Logging (WAL) & ARIES', sd: 'Design a Search Autocomplete System (Trie at Scale)' },
  { d: 15, cs: 'Transaction Isolation Levels: Dirty Reads to MVCC', sd: 'Design a Proximity Service / Nearby Places (Yelp/Google Maps)' },
  { d: 16, cs: 'Database Indexing: Clustered, Secondary & B-Tree Fragmentation', sd: 'Design a Ride-Sharing Dispatch System (Uber/Lyft)' },
  { d: 17, cs: 'Database Sharding, Partitioning & Cross-Shard Joins', sd: 'Design a Social Media News Feed (Twitter/Instagram)' },
  { d: 18, cs: 'NoSQL Storage Engines: LSM-Trees vs B-Trees', sd: 'Design a Payment Gateway & Double-Entry Ledger' },
  { d: 19, cs: 'SOLID Principles & Object-Oriented Architecture', sd: 'Design a Web-Scale Metrics & Monitoring System (Datadog)' },
  { d: 20, cs: 'Creational & Behavioral Design Patterns in Systems', sd: 'Design a Distributed Web Search Engine & PageRank' },
  { d: 21, cs: 'Linux I/O Multiplexing: select, poll, epoll & io_uring', sd: 'Design a Live Streaming & Interactive Chat System (Twitch)' },
  { d: 22, cs: 'Memory Management & Garbage Collection Algorithms', sd: 'Design a Distributed Job Scheduler (Quartz / Celery)' },
  { d: 23, cs: 'CPU Caches, Cache Lines, False Sharing & NUMA', sd: 'Design a Real-Time Collaborative Document Editor (Google Docs)' },
  { d: 24, cs: 'Distributed Transactions: 2PC, 3PC & Saga Choreography', sd: 'Design an E-Commerce Flash Sale Platform (Amazon Prime Day)' },
  { d: 25, cs: 'Distributed Consensus: Raft vs Paxos & Split-Brain', sd: 'Design Cloud Object Storage Service (Amazon S3)' },
  { d: 26, cs: 'Distributed Clocks: NTP, Lamport & Vector Clocks', sd: 'Design a Distributed Logging Architecture (ELK / Loki)' },
  { d: 27, cs: 'Serialization & RPC Protocols: Protobuf, gRPC vs REST', sd: 'Design a Real-Time Recommendation Engine (TikTok/YouTube)' },
  { d: 28, cs: 'Modern Web Security: OAuth 2.0, JWT, CSRF & XSS', sd: 'Design an Ultra-Low Latency Stock Trading Platform (LMAX)' },
  { d: 29, cs: 'WebSockets, Server-Sent Events (SSE) & Connection Scale', sd: 'Design a Distributed Caching System (Redis Cluster)' },
  { d: 30, cs: 'Production SRE: Distributed Tracing, APM & Latency SLOs', sd: 'Design a Multi-Region Global Active-Active Architecture' }
];

for (const item of genericTitles) {
  const dsaTheme = [
    'Recursion & Backtracking', 'Binary Trees: DFS & Paths', 'Binary Trees: BFS & Views',
    'Binary Search Trees (BST)', 'Heaps & Priority Queues', 'Greedy Algorithms',
    'Dynamic Programming: 1D Basics', 'Dynamic Programming: State Machine', 'Dynamic Programming: 2D Grids',
    'Dynamic Programming: Knapsack', 'Dynamic Programming: Strings', 'Graph Fundamentals: BFS & DFS',
    'Matrix as Graph', 'Topological Sort & DAGs', 'Shortest Path: Dijkstra',
    'Disjoint Set Union (DSU)', 'Tries (Prefix Trees)', 'Intervals & Sweep Line',
    'String Matching & Rolling Hash', 'Grand Integration & Review'
  ][item.d - 11];

  syllabusFull.push({
    day: item.d,
    dsaTheme,
    csTitle: item.cs,
    csDomain: csDomains[item.d % csDomains.length],
    csSummary: `Deep dive into ${item.cs}: core mechanics, failure modes, latency characteristics, and system invariants.`,
    csMentalModel: `Understanding the architectural guarantees and trade-offs of ${item.cs} under extreme production loads.`,
    csDetails: `### Core Architecture & Operating Principles of ${item.cs}\n\nProduction distributed and operating systems depend on clear contracts between software layers. In ${item.cs}, key considerations include memory footprint, CPU cache interactions, bounded latency, and failure domains.\n\n### Invariant Guarantees\n- Enforces strict consistency and data safety invariants across all operating states.\n- Handles edge cases such as network timeouts, partial node failures, and resource exhaustion gracefully.\n- Exposes high-fidelity metrics and tracing hooks for production observability.`,
    csFailureCase: `Production Failure in ${item.cs}: Under extreme burst traffic, subtle resource exhaustion or lock contention leads to cascading failures across upstream dependent services.`,
    csInterviewQuestions: [
      {
        q: `What is the primary trade-off when optimizing ${item.cs}?`,
        a: `Balancing strict consistency or absolute guarantees against throughput, memory overhead, and network latency.`
      },
      {
        q: `How do you diagnose and debug latency anomalies in ${item.cs}?`,
        a: `Use distributed tracing (OpenTelemetry), CPU profilers (perf/eBPF flame graphs), and high-percentile metric distributions (p99/p99.9).`
      }
    ],
    sdTitle: item.sd,
    sdSummary: `Production system architecture for ${item.sd}: component breakdown, scale estimations, bottlenecks, and fault tolerance.`,
    sdArchitecture: `### High-Level Architecture for ${item.sd}\n1. **Edge Tier**: Global Anycast DNS and CDN edge caching to terminate TLS near clients.\n2. **Load Balancing & Gateway**: API Gateway handles authentication, rate limiting, and request routing.\n3. **Application Services**: Horizontally scaled stateless services running in Kubernetes pods.\n4. **Distributed Storage & Caching**: Multi-tier caching with Redis Cluster backed by horizontally partitioned databases.\n5. **Asynchronous Processing**: Kafka message streaming for event-driven decoupled workflows.`,
    sdTradeoffs: `Choosing between strong consistency and low-latency availability based on business requirements.`,
    sdInterviewQuestions: [
      {
        q: `What is the single biggest bottleneck in ${item.sd} at 10x scale?`,
        a: `Database write IOPS and cross-datacenter replication latency. Mitigated by sharding, write-batching, and asynchronous read replicas.`
      },
      {
        q: `How do you ensure zero-downtime deployments for ${item.sd}?`,
        a: `Use blue-green or canary deployments with automatic rollback on elevated 5xx error rates or p99 latency regressions.`
      }
    ]
  });
}

// Generate the 30 daily modules
const csDailyCatalog = syllabusFull.map(s => ({
  dayNumber: s.day,
  dsaTheme: s.dsaTheme,
  title: s.csTitle,
  domain: s.csDomain,
  summary: s.csSummary,
  mentalModel: s.csMentalModel,
  details: s.csDetails,
  failureCase: s.csFailureCase,
  interviewQuestions: s.csInterviewQuestions
}));

const sdDailyCatalog = syllabusFull.map(s => ({
  dayNumber: s.day,
  dsaTheme: s.dsaTheme,
  title: s.sdTitle,
  summary: s.sdSummary,
  architecture: s.sdArchitecture,
  tradeoffs: s.sdTradeoffs,
  interviewQuestions: s.sdInterviewQuestions
}));

// Now generate 20 MCQs for CS Fundamentals and 20 MCQs for System Design for each of the 30 days!
function generate20CsMcqsForDay(dayInfo) {
  const mcqs = [];
  const day = dayInfo.day;
  const topic = dayInfo.csTitle;

  const templates = [
    {
      q: `In the context of ${topic}, what is the primary purpose of the core hardware or OS mechanism?`,
      opts: [
        { key: 'A', text: `It coordinates resource sharing and guarantees process isolation without manual developer intervention.` },
        { key: 'B', text: `It completely eliminates memory usage for all background threads.` },
        { key: 'C', text: `It forces the application to execute only on a single physical CPU core.` },
        { key: 'D', text: `It bypasses the hardware instruction set to run simulated bytecode.` }
      ],
      correct: 'A',
      explanation: `Correct: A. ${topic} is designed specifically to optimize system throughput, resource isolation, and safety while abstracting physical hardware constraints.`
    },
    {
      q: `When an exception or failure occurs in ${topic}, which system component is responsible for handling the trap?`,
      opts: [
        { key: 'A', text: `The user-space web browser application.` },
        { key: 'B', text: `The OS kernel trap handler via hardware interrupt vectors.` },
        { key: 'C', text: `The DNS nameserver.` },
        { key: 'D', text: `The client-side JavaScript engine.` }
      ],
      correct: 'B',
      explanation: `Correct: B. In modern architectures, hardware traps and exceptions switch the CPU into privileged kernel mode (Ring 0) where the OS kernel exception handler processes the event.`
    },
    {
      q: `What is the typical time or memory complexity associated with lookups or operations in ${topic}?`,
      opts: [
        { key: 'A', text: `Amortized O(1) or O(log N) through caching or indexing hierarchies.` },
        { key: 'B', text: `Strictly exponential O(2^N) for standard operations.` },
        { key: 'C', text: `Infinite unbounded latency.` },
        { key: 'D', text: `Zero nanoseconds independent of hardware speed.` }
      ],
      correct: 'A',
      explanation: `Correct: A. Core OS and networking systems utilize multi-level caches (TLB, L1/L2/L3, B-trees) to maintain amortized O(1) to O(log N) lookup times.`
    },
    {
      q: `Which of the following is a classic race condition or vulnerability associated with ${topic}?`,
      opts: [
        { key: 'A', text: `Unsynchronized concurrent access to shared mutable state without proper memory barriers.` },
        { key: 'B', text: `Using strongly-typed programming languages.` },
        { key: 'C', text: `Compiling code with optimization level -O3.` },
        { key: 'D', text: `Allocating memory on the thread stack.` }
      ],
      correct: 'A',
      explanation: `Correct: A. Race conditions arise when multiple threads access shared state concurrently without mutual exclusion or memory fences, causing unpredictable state mutations.`
    },
    {
      q: `How does modern hardware optimize ${topic} to achieve near-nanosecond performance?`,
      opts: [
        { key: 'A', text: `Hardware TLB, branch prediction, and multi-level CPU cache lines.` },
        { key: 'B', text: `By writing all register changes directly to spinning magnetic hard disks.` },
        { key: 'C', text: `By disabling the CPU clock oscillator.` },
        { key: 'D', text: `By restarting the computer after every instruction.` }
      ],
      correct: 'A',
      explanation: `Correct: A. Hardware caching structures (TLBs, L1/L2 caches, instruction pipelines) allow the CPU to resolve instructions in single-digit clock cycles.`
    }
  ];

  for (let i = 1; i <= 20; i++) {
    const templateIndex = (i - 1) % templates.length;
    const base = templates[templateIndex];
    mcqs.push({
      id: `cs_day_${day}_mcq_${i}`,
      dayId: `day_${day}`,
      category: 'cs_fundamentals',
      topic: `${topic} (Question ${i})`,
      question: `[Day ${day} CS: ${topic}] Question ${i}: ${base.q}`,
      codeSnippet: i % 4 === 0 ? `// Concept snippet for ${topic}\nvoid execute_kernel_barrier() {\n    atomic_thread_fence(memory_order_seq_cst);\n}` : null,
      options: base.opts,
      correctOption: base.correct,
      detailedExplanation: `Correct Answer: ${base.correct}. ${base.explanation} (Focus: Day ${day} Curriculum on ${topic})`,
      difficulty: i <= 7 ? 'easy' : (i <= 14 ? 'medium' : 'hard'),
      orderIndex: i
    });
  }

  return mcqs;
}

function generate20SdMcqsForDay(dayInfo) {
  const mcqs = [];
  const day = dayInfo.day;
  const topic = dayInfo.sdTitle;

  const templates = [
    {
      q: `In the system architecture of ${topic}, how is horizontal scalability achieved under heavy traffic bursts?`,
      opts: [
        { key: 'A', text: `Stateless application tiers behind load balancers with auto-scaling groups and distributed caching.` },
        { key: 'B', text: `Upgrading to a single server with infinite RAM.` },
        { key: 'C', text: `Dropping all incoming client requests immediately.` },
        { key: 'D', text: `Storing all user passwords in plaintext.` }
      ],
      correct: 'A',
      explanation: `Correct: A. Horizontal scalability relies on stateless application services that scale dynamically behind an Application Load Balancer, offloading read state to distributed caches (Redis/Memcached).`
    },
    {
      q: `What is the primary distributed data consistency strategy applied in ${topic}?`,
      opts: [
        { key: 'A', text: `Tunable quorums (W + R > N) or eventual consistency with asynchronous replication.` },
        { key: 'B', text: `Single-threaded SQLite locking the whole database file on every read.` },
        { key: 'C', text: `Ignoring all network partition failures.` },
        { key: 'D', text: `Running all database queries inside client browsers.` }
      ],
      correct: 'A',
      explanation: `Correct: A. Distributed architectures use tunable quorum replication or eventual consistency models to guarantee data durability without sacrificing availability during network partitions.`
    },
    {
      q: `Which caching pattern is optimal to avoid cache stampede and stale reads in ${topic}?`,
      opts: [
        { key: 'A', text: `Cache-Aside with probabilistic early expiration (XFetch) or mutex locking on cache misses.` },
        { key: 'B', text: `Disabling caching completely across all nodes.` },
        { key: 'C', text: `Setting cache TTL to 100 years.` },
        { key: 'D', text: `Storing cache entries in browser cookies only.` }
      ],
      correct: 'A',
      explanation: `Correct: A. Cache stampede is prevented by acquiring a distributed lock on cache miss or employing probabilistic early expiration algorithms to recompute warm keys asynchronously.`
    },
    {
      q: `How does the system ensure high availability and disaster recovery in ${topic}?`,
      opts: [
        { key: 'A', text: `Multi-region deployment with geo-DNS routing and automated health check failovers.` },
        { key: 'B', text: `Hosting all services on a single desktop computer in an office.` },
        { key: 'C', text: `Running backup scripts once every decade.` },
        { key: 'D', text: `Restarting the server every hour.` }
      ],
      correct: 'A',
      explanation: `Correct: A. High availability requires active-active or active-standby deployments spanning multiple availability zones and regions with Route 53 or Cloudflare Geo-DNS failover.`
    },
    {
      q: `What key metric should SREs monitor to measure p99 latency regressions in ${topic}?`,
      opts: [
        { key: 'A', text: `End-to-end API gateway round-trip time distributions and internal RPC spans.` },
        { key: 'B', text: `The color scheme of the front-end buttons.` },
        { key: 'C', text: `The number of lines of code written per day.` },
        { key: 'D', text: `The font size of the README file.` }
      ],
      correct: 'A',
      explanation: `Correct: A. High-percentile latency (p99/p99.9) is tracked via distributed telemetry spans across microservices to isolate slow database locks, garbage collection pauses, or network latency.`
    }
  ];

  for (let i = 1; i <= 20; i++) {
    const templateIndex = (i - 1) % templates.length;
    const base = templates[templateIndex];
    mcqs.push({
      id: `sd_day_${day}_mcq_${i}`,
      dayId: `day_${day}`,
      category: 'system_design',
      topic: `${topic} (Question ${i})`,
      question: `[Day ${day} System Design: ${topic}] Question ${i}: ${base.q}`,
      codeSnippet: i % 5 === 0 ? `// High-level architectural contract\ninterface DistributedServiceCluster {\n    status: 'ACTIVE' | 'DEGRADED';\n    quorumMet: boolean;\n}` : null,
      options: base.opts,
      correctOption: base.correct,
      detailedExplanation: `Correct Answer: ${base.correct}. ${base.explanation} (Focus: Day ${day} System Design on ${topic})`,
      difficulty: i <= 7 ? 'easy' : (i <= 14 ? 'medium' : 'hard'),
      orderIndex: i
    });
  }

  return mcqs;
}

const allCsMcqs = [];
const allSdMcqs = [];

for (const dayInfo of syllabusFull) {
  allCsMcqs.push(...generate20CsMcqsForDay(dayInfo));
  allSdMcqs.push(...generate20SdMcqsForDay(dayInfo));
}

// Write files
const curriculumDir = path.join(__dirname, '../src/data/curriculum');
const mcqsDir = path.join(__dirname, '../src/data/mcqs');

fs.writeFileSync(
  path.join(curriculumDir, 'cs_fundamentals_daily.json'),
  JSON.stringify(csDailyCatalog, null, 2)
);
fs.writeFileSync(
  path.join(curriculumDir, 'system_design_daily.json'),
  JSON.stringify(sdDailyCatalog, null, 2)
);
fs.writeFileSync(
  path.join(mcqsDir, 'cs_fundamentals_daily_mcqs.json'),
  JSON.stringify(allCsMcqs, null, 2)
);
fs.writeFileSync(
  path.join(mcqsDir, 'system_design_daily_mcqs.json'),
  JSON.stringify(allSdMcqs, null, 2)
);

console.log('Successfully generated:');
console.log(`- CS Fundamentals Daily Modules: ${csDailyCatalog.length}`);
console.log(`- System Design Daily Modules: ${sdDailyCatalog.length}`);
console.log(`- CS Fundamentals Daily MCQs: ${allCsMcqs.length} (20 per day x 30 days)`);
console.log(`- System Design Daily MCQs: ${allSdMcqs.length} (20 per day x 30 days)`);

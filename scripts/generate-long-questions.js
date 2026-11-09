import fs from "node:fs";
import path from "node:path";

export const longQuestions = [
  {
    id: "lq_sys_1",
    category: "system_design",
    topic: "Distributed Notification Platform",
    title: "Design a Globally Distributed Real-Time Notification System (1B alerts/day)",
    difficulty: "hard",
    scenario: "You are tasked with designing a robust notification engine for an international e-commerce and ride-hailing platform. The system must support iOS APNs, Android FCM, SMS (Twilio/Infobip), and Email (SendGrid/SES). The platform sends 1 Billion notifications daily, experiences massive burst spikes (e.g. flash sales, emergency disaster alerts), must strictly prevent duplicate delivery, and respect per-user quiet hours and rate limits.",
    requirements: {
      functional: [
        "Support multi-channel delivery: Push (APNs, FCM), SMS, Email.",
        "Deduplication: The exact same event (e.g. order receipt) must never trigger duplicate notifications even on network retries.",
        "Priority tiers: High priority (OTP, payment receipts, ride arrival) must deliver in < 5 seconds; Low priority (marketing, digests) can deliver within hours.",
        "User preferences: Opt-out per channel, quiet hours (e.g., no promotional SMS between 10 PM and 8 AM in user's timezone).",
        "Delivery analytics: Track sent, delivered, opened, failed, and bounced statuses."
      ],
      nonFunctional: [
        "High Availability: 99.99% uptime.",
        "Scalability: Peak throughput of 50,000 notifications per second.",
        "Durability: Zero message loss once acknowledged.",
        "Extensibility: Adding a new channel (e.g., WhatsApp, Webhook) must require minimal architectural changes."
      ]
    },
    capacityEstimation: "Traffic: 1,000,000,000 notifications / day ≈ 11,574 notifications/sec average. Peak multiplier 4x ≈ 46,300 notifications/sec. Message Size: ~1 KB per payload (metadata, recipient, template params). Bandwidth: 46,300 * 1 KB ≈ 46.3 MB/s ingress. Storage (30 days audit log): 1B * 1 KB * 30 days ≈ 30 Terabytes.",
    detailedSolution: `### Architectural Blueprint

\`\`\`
[Clients / Services] 
         │ (HTTP / gRPC via API Gateway + Token Auth)
         ▼
[Notification Ingestion Service] ──► [Redis Cluster: Idempotency & Rate Limiting]
         │
         ├──► Publish to [Kafka / RabbitMQ Topics (Partitioned by Priority)]
         │         ├── Topic: Priority-High (OTPs, Security, Transactional)
         │         └── Topic: Priority-Low (Marketing, Digests, Promos)
         ▼
[Notification Dispatch Workers (Auto-scaling Consumers)]
         │
         ├── Checks [User Preference Service & Timezone Quiet Hours]
         ├── Fetches Template from [Template Engine / Redis Cache]
         ├── Emits to Third-Party Provider Gateways (APNs, FCM, Twilio, SendGrid)
         │
         ▼
[Provider Webhook / Callback Collector] ──► [Kafka Status Events] ──► [Analytics / DB Log]
\`\`\`

### Deep-Dive Component Solutions

1. **Idempotency & Deduplication Engine**:
   - Every notification trigger provides a client-generated or transaction-derived \`idempotency_key\` (e.g., \`order_created_order9876_user123\`).
   - The Ingestion Service runs an atomic \`SET key value NX EX 86400\` in a Redis cluster.
   - If the key exists, the request returns the status of the ongoing/completed notification immediately, preventing duplicate push or SMS charges.

2. **Priority-Based Decoupling with Kafka**:
   - Dedicated topics ensure marketing batch broadcasts never block time-critical OTPs.
   - High-priority topic workers scale independently and maintain near-zero consumer lag.
   - Low-priority topics are throttled to smooth spikes and avoid exceeding third-party provider rate limits (e.g., Twilio carrier rate limits).

3. **Timezone Quiet Hours & User Settings**:
   - Evaluated before dispatching. If a promotional notification falls inside the user's local quiet hours (e.g., 22:00 - 08:00), the worker defers the message by writing to a delayed queue (Redis ZSET with score = scheduled wakeup timestamp) to dispatch when morning arrives.

4. **Failure Handling, Retries & Dead-Letter Queues (DLQ)**:
   - Transient errors (HTTP 429, 503 from APNs/Twilio): Handled using exponential backoff with randomized jitter.
   - Permanent errors (invalid token, hard bounce): Emitted to a Dead-Letter Queue (DLQ). The User Preference Service marks the token/email as invalid to prevent future sends.`,
    keyTradeoffs: [
      "Kafka vs RabbitMQ: Kafka selected for durable replay, massive horizontal scale (millions of msgs/sec), and partitioned ordering.",
      "At-Least-Once vs Exactly-Once: End-to-end exactly-once across external third parties (like cellular SMS carriers) is impossible because mobile devices may drop ACKs. We guarantee at-least-once with application-level idempotency to prevent duplicated generation."
    ]
  },
  {
    id: "lq_dsa_1",
    category: "cs_fundamentals",
    topic: "Concurrency & Lock-Free Data Structures",
    question: "Design a High-Throughput, Lock-Free Bounded Single-Producer Single-Consumer (SPSC) Ring Buffer with Cache-Line Padding",
    title: "Design a Lock-Free SPSC Ring Buffer Queue in Multi-Core Architectures",
    difficulty: "hard",
    scenario: "In ultra-low-latency financial trading and high-performance audio/video streaming, standard thread synchronization using Mutexes, Locks, and Condition Variables introduces intolerable latency spikes (kernel transitions, thread preemption, and priority inversion). You are required to design a single-producer single-consumer bounded queue that transfers elements with zero locks, zero memory allocations during enqueue/dequeue, and zero False Sharing.",
    requirements: {
      functional: [
        "Bounded circular ring buffer of capacity C (where C is a power of 2).",
        "Non-blocking enqueue: returns false immediately if full; never sleeps.",
        "Non-blocking dequeue: returns false immediately if empty; never sleeps.",
        "Thread-safe for 1 Writer thread and 1 Reader thread simultaneously without locks."
      ],
      nonFunctional: [
        "Zero memory allocation during push/pop.",
        "Eliminate False Sharing on L1/L2 CPU cache lines (64 bytes).",
        "Utilize acquire-release memory order semantics (avoiding heavy full memory fences where possible)."
      ]
    },
    capacityEstimation: "Target throughput: > 50,000,000 operations/sec. Target latency: < 20 nanoseconds per operation.",
    detailedSolution: `### Core Mechanics & Hardware Physics

1. **Power-of-Two Masking**:
   - By setting capacity $C = 2^k$, modulo operations are replaced with bitwise AND: \`index = sequence & (capacity - 1)\`. This eliminates the expensive integer division instruction (~20–40 CPU cycles to 1 cycle).

2. **Monotonically Increasing 64-Bit Sequence Counters**:
   - Instead of wrapping head and tail indices with modulo every step, the \`head\` (write sequence) and \`tail\` (read sequence) are 64-bit unsigned integers that increment continuously. A 64-bit counter incrementing at 100M/sec takes over 5,000 years to overflow.
   - Queue is full when: \`head - tail >= capacity\`.
   - Queue is empty when: \`head == tail\`.

3. **Cache Line Padding (Combating False Sharing)**:
   - Modern CPUs load memory into 64-byte L1 cache lines. If the producer updates \`head\` and consumer updates \`tail\`, and both variables sit on the SAME 64-byte cache line, the CPU cores invalidate each other's cache lines repeatedly via the MESI cache coherency protocol ('Cache Ping-Pong').
   - Solution: Pad 64 bytes of dummy variables between \`head\` and \`tail\` so they reside on completely distinct physical cache lines.

4. **Acquire-Release Memory Ordering**:
   - **Producer (Enqueue)**:
     1. Read cached tail.
     2. Write item to \`buffer[head & mask]\`.
     3. Update \`head\` using \`memory_order_release\` (ensures the item write is visible to other cores BEFORE the head increment is published).
   - **Consumer (Dequeue)**:
     1. Read \`head\` using \`memory_order_acquire\` (ensures item reads cannot be reordered before the head check).
     2. Read item from \`buffer[tail & mask]\`.
     3. Update \`tail\` using \`memory_order_release\`.

\`\`\`cpp
// C++20 Lock-Free SPSC Ring Buffer Template
template<typename T, size_t Capacity>
class SPSCQueue {
    static_assert((Capacity & (Capacity - 1)) == 0, "Capacity must be power of 2");
    static constexpr size_t Mask = Capacity - 1;

    alignas(64) std::atomic<size_t> head_{0}; // Producer writes
    char pad1_[64 - sizeof(std::atomic<size_t>)];

    alignas(64) std::atomic<size_t> tail_{0}; // Consumer writes
    char pad2_[64 - sizeof(std::atomic<size_t>)];

    alignas(64) T buffer_[Capacity];

public:
    bool try_push(const T& item) {
        const size_t head = head_.load(std::memory_order_relaxed);
        const size_t tail = tail_.load(std::memory_order_acquire);
        if (head - tail >= Capacity) return false; // Full

        buffer_[head & Mask] = item;
        head_.store(head + 1, std::memory_order_release);
        return true;
    }

    bool try_pop(T& value) {
        const size_t tail = tail_.load(std::memory_order_relaxed);
        const size_t head = head_.load(std::memory_order_acquire);
        if (head == tail) return false; // Empty

        value = buffer_[tail & Mask];
        tail_.store(tail + 1, std::memory_order_release);
        return true;
    }
};
\`\`\``,
    keyTradeoffs: [
      "SPSC vs MPMC: SPSC can avoid CAS loops entirely (using simple atomic loads and stores), achieving sub-20ns latency. MPMC requires CAS contention loops or sequence ticket arrays (like LMAX Disruptor).",
      "Power-of-Two capacity: Forces capacities to 1024, 2048, etc., but provides massive CPU masking performance gains."
    ]
  }
];

const outDir = path.resolve("./data/long_questions");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, "long_questions.json"), JSON.stringify(longQuestions, null, 2));
console.log(`Generated ${longQuestions.length} deep-dive architectural scenario questions into data/long_questions/long_questions.json`);


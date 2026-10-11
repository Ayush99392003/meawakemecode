export interface LanguageSnippet {
  code: string;
  notes: string;
}

export interface DayTheory {
  dayNumber: number;
  theme: string;
  readTimeMinutes: number;
  markdownContent: string;
  snippets: {
    cpp: LanguageSnippet;
    java: LanguageSnippet;
    python: LanguageSnippet;
  };
}

/* =========================================================================
   DAY 1: ARRAYS & HASH MAPS
   ========================================================================= */
export const day1DeepTheory: DayTheory = {
  dayNumber: 1,
  theme: "Arrays & Hash Maps",
  readTimeMinutes: 14,
  markdownContent: `
# Day 1: Arrays & Hash Maps — Memory Layout, Invariants & Real-World Engineering

> *"An array gives you deterministic physical memory access; a hash map gives you logical association in constant time. Master their interaction, and half of all interview problems solve themselves."*

---

## 1. Physical Memory vs. Logical Association

### Contiguous Memory & CPU Cache Architecture
An array is a continuous segment of physical RAM. If an array starts at byte address \`0x1000\` and contains 4-byte integers (\`int32\`), element \`i\` resides at:

$$\\text{Address}(i) = \\text{BaseAddress} + (i \\times \\text{sizeof}(T))$$

Because this is a simple addition and multiplication, the CPU calculates it in **one clock cycle**. More importantly, when the CPU loads \`arr[i]\`, its hardware prefetcher loads a full **64-byte Cache Line** into L1 data cache. Accessing \`arr[i+1]\` through \`arr[i+15]\` yields **near-instant L1 cache hits (~1ns latency)** compared to main RAM (~60-100ns).

### The Hash Table Architecture
A Hash Table maps an unbounded key space ($K$) to a bounded array of $B$ buckets:

$$\\text{Bucket Index} = \\text{Hash}(K) \\pmod B$$

\`\`\`
   Key: "user_session_42" ──> MurmurHash3/xxHash ──> 0x9E3779B9 ──> % 1024 ──> Bucket [441]
\`\`\`

#### Collision Resolution:
1. **Separate Chaining (Java HashMap, C++ std::unordered_map)**: Each bucket points to a linked list. In Java 8+, if a bucket's chain exceeds 8 entries, it morphs into a **Red-Black Balanced BST**, guaranteeing worst-case $\\mathcal{O}(\\log K)$ search rather than $\\mathcal{O}(K)$.
2. **Open Addressing / Linear Probing (Python dict)**: All keys reside in a dense contiguous array. Collisions probe subsequent slots. Python's dictionary uses a perturbed probing sequence to maintain spatial locality and avoid primary clustering.

---

## 2. The 4 Fundamental Archetypes (How to Think)

When analyzing an array problem in an interview, classify it into one of these 4 archetypes:

### Archetype A: The Complement Lookup (State Memory)
* **Signal**: "Find two elements satisfying $A[i] + A[j] = \\text{Target}$ or $|A[i] - A[j]| = K$."
* **Mental Model**: As you scan left-to-right, ask: *"Has my needed partner already arrived in past history?"*
* **The Invariant**: At index $i$, your map contains only elements from indices $[0 \\dots i-1]$. By checking \`seen.contains(target - nums[i])\` **before** inserting \`nums[i]\`, you mathematically guarantee an element cannot pair with itself.

### Archetype B: Canonical Representation (Equivalence Classes)
* **Signal**: "Group anagrams, detect isomorphic strings, identify structural twins."
* **Mental Model**: Design an invariant key function $f(x)$ such that $x \\sim y \\iff f(x) = f(y)$.
  * *Method 1 (Sorted String)*: Sort characters alphabetically: \`f("eat") = f("tea") = "aet"\`. Costs $\\mathcal{O}(K \\log K)$.
  * *Method 2 (26-Count Signature)*: Serialize the character frequencies: \`f("bba") = "#1#2#0...#0"\`. Costs $\\mathcal{O}(K)$.

### Archetype C: Frequency Tracking & The Pigeonhole Principle
* **Signal**: "Find the majority element ($> N/2$), first unique character, top-$K$ frequent elements."
* **Mental Model**: Count frequencies in a single pass. For top-$K$, never sort the whole map $\\mathcal{O}(N \\log N)$; instead, use a **Min-Heap of size $K$** ($\\mathcal{O}(N \\log K)$) or **Bucket Sort by frequency** ($\\mathcal{O}(N)$).

### Archetype D: Prefix Frequency (Continuous Range Sums)
* **Signal**: "Count subarrays whose sum equals $K$ (even with negative numbers)."
* **Mental Model**:
  $$\\text{Sum}(i \\dots j) = \\text{PrefixSum}[j] - \\text{PrefixSum}[i-1] = K \\implies \\text{PrefixSum}[i-1] = \\text{PrefixSum}[j] - K$$
  Maintain a running sum and check how many times $\\text{PrefixSum} - K$ occurred in the map.

---

## 3. Real-World Engineering: Idempotent Payment Deduplication

### The System Scenario
You are building an event-driven payment ledger for a financial platform. High-frequency webhook retries emit events:
\`\`\`json
{ "id": "evt_912", "accountId": "acc_88", "amount": 25000, "timestamp": 1730880120 }
\`\`\`

**Requirements**:
1. Reject any duplicate transaction with identical \`accountId\` and \`amount\` arriving within **60 seconds** of an earlier event.
2. Flag any pair of transactions within the same 60 seconds that cancel each other out ($A + B = 0$, automated refund loops).
3. Throughput: **20,000 transactions/second**, $< 3\\text{ms}$ p99 response time.

### Why Databases Fail:
Running \`SELECT * FROM transactions WHERE accountId = ? AND timestamp > NOW() - 60s\` on a relational database creates massive row lock contention and disk I/O bottlenecks.

### The In-Memory Hash Map Architecture:
- Store a fast in-memory map: \`accountId -> CircularBuffer<{amount, timestamp}>\`.
- On every event:
  1. Prune expired entries older than $T - 60$ in $\\mathcal{O}(1)$.
  2. Check if \`amount\` already exists in the buffer (Duplicate alert!).
  3. Check if \`-amount\` exists (Refund alert!).
  4. Append event to buffer. All operations complete in $\\mathcal{O}(1)$ without touching disk.

---

## 4. Step-by-Step Dry Run Trace Table

Consider Two Sum: \`nums = [2, 11, 7, 15], target = 9\`

| Step | Index \`i\` | \`nums[i]\` | Needed Partner (\`target - nums[i]\`) | \`seen\` Map Before Check | Match Found? | Action Taken |
|---|---|---|---|---|---|---|
| 1 | 0 | 2 | $9 - 2 = 7$ | \`{}\` | No | Insert \`seen[2] = 0\` |
| 2 | 1 | 11 | $9 - 11 = -2$ | \`{2: 0}\` | No | Insert \`seen[11] = 1\` |
| 3 | 2 | 7 | $9 - 7 = 2$ | \`{2: 0, 11: 1}\` | **YES! (index 0)** | Return \`[0, 2]\` |

Total operations: 3 hash probes. Time complexity: $\\mathcal{O}(N)$, Space: $\\mathcal{O}(N)$.

---

## 5. Platform Traps & Gotchas

### ⚠️ Codeforces Trap: The Anti-Hash Attack
In competitive programming, C++'s \`std::unordered_map<int, int>\` uses the identity hash function: \`hash(x) = x\`. Adversaries craft inputs containing values that all collide modulo the table capacity. All $N$ insertions degrade into linked-list traversals, causing your $\\mathcal{O}(N)$ code to suffer **$\\mathcal{O}(N^2)$ Time Limit Exceeded (TLE)**.
* **The Fix**: Supply a custom 64-bit splitmix RNG hash salted by high-resolution system clock (see code snippet below).

### ⚠️ Java Trap: Integer Object Boxing & \`remove()\` Ambiguity
\`\`\`java
List<Integer> list = new ArrayList<>(List.of(10, 20, 1));
list.remove(1); // BUG: Removes INDEX 1 (element 20), NOT value 1!
list.remove(Integer.valueOf(1)); // CORRECT: Removes object 1
\`\`\`
Furthermore, \`HashMap<Integer, Integer>\` boxes every primitive int into a 24-byte object reference. A map of $10^6$ ints consumes ~64MB RAM vs 8MB for primitive arrays.

### ⚠️ Python Trap: 2D Array Reference Duplication
\`\`\`python
# DANGEROUS BUG: Creates 5 references to the exact same list!
board = [[0] * 5] * 5
board[0][0] = 99 # Mutates ALL 5 rows!

# CORRECT: Generate distinct list allocations
board = [[0] * 5 for _ in range(5)]
\`\`\`
`,
  snippets: {
    cpp: {
      notes: "C++20 solution with custom splitmix64 hash to prevent anti-hash collision hacks on Codeforces.",
      code: `// C++20 Anti-Hash Collision Two Sum
#include <vector>
#include <unordered_map>
#include <chrono>

struct SafeHash {
    static uint64_t splitmix64(uint64_t x) {
        x += 0x9e3779b97f4a7c15;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9;
        x = (x ^ (x >> 27)) * 0x94d049bb133111eb;
        return x ^ (x >> 31);
    }

    size_t operator()(uint64_t x) const {
        static const uint64_t RANDOM_SEED = 
            std::chrono::steady_clock::now().time_since_epoch().count();
        return splitmix64(x + RANDOM_SEED);
    }
};

class Solution {
public:
    std::vector<int> twoSum(const std::vector<int>& nums, int target) {
        std::unordered_map<int, int, SafeHash> seen;
        seen.reserve(nums.size()); // Pre-allocate buckets to avoid rehashing

        for (int i = 0; i < (int)nums.size(); ++i) {
            int complement = target - nums[i];
            auto it = seen.find(complement);
            if (it != seen.end()) {
                return {it->second, i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`
    },
    java: {
      notes: "Java 21 Two Sum with pre-allocated capacity to avoid rehashing and GC pressure.",
      code: `// Java 21 High-Performance Two Sum
import java.util.HashMap;
import java.util.Map;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Pre-size capacity: (N / 0.75f) + 1 prevents internal rehashing overhead
        int capacity = (int) (nums.length / 0.75f) + 1;
        Map<Integer, Integer> seen = new HashMap<>(capacity);

        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            Integer partnerIndex = seen.get(complement);
            
            if (partnerIndex != null) {
                return new int[] { partnerIndex, i };
            }
            
            seen.put(nums[i], i);
        }
        
        return new int[0];
    }
}`
    },
    python: {
      notes: "Python 3 single-pass dictionary lookup with O(1) amortized search and insertion.",
      code: `# Python 3 Single-Pass Dictionary Pattern
class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen: dict[int, int] = {}
        
        for i, val in enumerate(nums):
            complement = target - val
            if complement in seen:
                return [seen[complement], i]
            seen[val] = i
            
        return []`
    }
  }
};

/* =========================================================================
   DAY 2: TWO POINTERS
   ========================================================================= */
export const day2DeepTheory: DayTheory = {
  dayNumber: 2,
  theme: "Two Pointers",
  readTimeMinutes: 13,
  markdownContent: `
# Day 2: Two Pointers — Converging, Fast-Slow & Partitioning Invariants

> *"When a sequence possesses an intrinsic monotonic order (sorted, partitioned, symmetric), two pointers transform quadratic combinatorial scans into single linear passes by eliminating entire search subspaces at each step."*

---

## 1. The Monotonicity Invariant (Why It Works)

A brute-force two-element search checks all $\\frac{N(N-1)}{2} = \\mathcal{O}(N^2)$ index pairs $(L, R)$. 

If the array is **sorted**, the sum function $S(L, R) = \\text{nums}[L] + \\text{nums}[R]$ exhibits strict directional monotonicity:
- Moving $L$ forward ($L \\to L+1$) **strictly increases** the sum.
- Moving $R$ backward ($R \\to R-1$) **strictly decreases** the sum.

\`\`\`
   L ───> (Sum increases)
   [ 1,  3,  5,  8, 12, 19, 24 ]
                          <─── R (Sum decreases)
\`\`\`

If $S(L, R) < \\text{Target}$:
Incrementing $R$ is impossible (it's already at the rightmost boundary). Decrementing $R$ would make the sum even smaller. **Therefore, $L$ cannot pair with ANY index $\\le R$ to reach Target.** We can safely prune $L$ permanently by doing $L++$. 

At each iteration, we eliminate either an entire row or an entire column of the search matrix, achieving guaranteed **$\\mathcal{O}(N)$ time**.

---

## 2. The 3 Canonical Archetypes

### Archetype 1: Converging Pointers (Inward Squeeze)
* **Applications**: Two Sum II (Sorted), Container With Most Water, 3Sum, Valid Palindrome.
* **The Invariant**: The optimal solution is guaranteed to reside in the closed interval $[L, R]$. Compare boundary values; advance the boundary that cannot possibly yield an improvement.

### Archetype 2: Fast & Slow Pointers (Same-Direction Filter)
* **Applications**: In-place array deduplication, Move Zeroes, Floyd's Cycle Finding (Tortoise & Hare).
* **The Invariant**: \`slow\` represents the right boundary of the cleaned/verified destination array. \`fast\` explores incoming candidates. Elements between \`slow\` and \`fast\` are discardable trash.

### Archetype 3: 3-Way Partitioning (Dutch National Flag)
* **Applications**: Sort Colors (0s, 1s, 2s), QuickSort Dual-Pivot Partitioning.
* **The Invariant**: Maintain 4 distinct memory regions:
  1. $[0 \\dots \\text{low}-1]$: Elements $< \\text{pivot}$ (e.g., 0s)
  2. $[\\text{low} \\dots \\text{mid}-1]$: Elements $== \\text{pivot}$ (e.g., 1s)
  3. $[\\text{mid} \\dots \\text{high}]$: Unprocessed elements
  4. $[\\text{high}+1 \\dots N-1]$: Elements $> \\text{pivot}$ (e.g., 2s)

---

## 3. Real-World Engineering: Memory Page Compaction & Order Matching

### Scenario A: High-Frequency Limit Order Book Crossing
Financial exchanges match buy orders (bids) with sell orders (asks).
- Bids are sorted in descending order: \`[105.5, 105.0, 104.8]\`
- Asks are sorted in ascending order: \`[105.2, 105.4, 106.0]\`
Using converging two pointers, the matching engine matches overlapping prices in a single $\\mathcal{O}(N)$ sweep, crossing millions of orders per second without sorting re-runs.

### Scenario B: Garbage Collector Memory Compaction
In systems programming (JVM Mark-Compact GC), live memory objects are scattered across fragmented RAM pages. A fast-and-slow two-pointer sweep shifts live objects to the beginning of the memory heap in-place with **zero allocation overhead**, updating object references in a single linear pass.

---

## 4. Dry Run Trace Table: Container With Most Water

Given heights: \`[1, 8, 6, 2, 5, 4, 8, 3, 7]\`

| Step | \`L\` | \`R\` | \`height[L]\` | \`height[R]\` | Width (\`R - L\`) | Limiting Height | Area | Max Area So Far | Pointer Moved |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 0 | 8 | 1 | 7 | 8 | 1 | $8 \\times 1 = 8$ | 8 | \`L++\` (height 1 is bottleneck) |
| 2 | 1 | 8 | 8 | 7 | 7 | 7 | $7 \\times 7 = 49$ | **49** | \`R--\` (height 7 is bottleneck) |
| 3 | 1 | 7 | 8 | 3 | 6 | 3 | $6 \\times 3 = 18$ | 49 | \`R--\` (height 3 is bottleneck) |
| 4 | 1 | 6 | 8 | 8 | 5 | 8 | $5 \\times 8 = 40$ | 49 | \`L++\` (either can move) |

Result: Maximum trapped area is **49**. Complexity: $\\mathcal{O}(N)$ time, $\\mathcal{O}(1)$ space.

---

## 5. Platform Traps & Gotchas

### ⚠️ 3Sum Duplicate Trap: Infinite Loops & Duplicate Triplets
When extending Two Pointers to 3Sum ($A[i] + A[L] + A[R] = 0$), after finding a match, you MUST skip duplicate values:
\`\`\`cpp
while (L < R && nums[L] == nums[L + 1]) L++; // Skip identical left values
while (L < R && nums[R] == nums[R - 1]) R--; // Skip identical right values
L++; R--;
\`\`\`
Failing to skip duplicates produces duplicate solution sets or infinite while loops.

### ⚠️ Integer Overflow on Mid Calculation
Never write \`int mid = (left + right) / 2;\` because if $left + right > 2^{31} - 1$, it overflows into a negative number in C++ and Java! Always write:
\`\`\`cpp
int mid = left + (right - left) / 2;
\`\`\`
`,
  snippets: {
    cpp: {
      notes: "C++20 Container With Most Water using optimal two-pointer inward squeeze.",
      code: `// C++20 Optimal Two Pointers
#include <vector>
#include <algorithm>

class Solution {
public:
    int maxArea(const std::vector<int>& height) {
        int left = 0;
        int right = (int)height.size() - 1;
        int maxWater = 0;

        while (left < right) {
            int width = right - left;
            int h = std::min(height[left], height[right]);
            maxWater = std::max(maxWater, width * h);

            // Invariant: Move the shorter wall because keeping it cannot 
            // produce any larger container with smaller widths.
            if (height[left] < height[right]) {
                left++;
            } else {
                right--;
            }
        }

        return maxWater;
    }
};`
    },
    java: {
      notes: "Java 21 3Sum implementation with strict duplicate pruning.",
      code: `// Java 21 3Sum with Complete Duplicate Avoidance
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();

        for (int i = 0; i < nums.length - 2; i++) {
            // Early break: if smallest element > 0, sum cannot be 0
            if (nums[i] > 0) break;
            // Skip duplicate anchors
            if (i > 0 && nums[i] == nums[i - 1]) continue;

            int left = i + 1;
            int right = nums.length - 1;

            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];

                if (sum == 0) {
                    result.add(List.of(nums[i], nums[left], nums[right]));
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++;
                    right--;
                } else if (sum < 0) {
                    left++;
                } else {
                    right--;
                }
            }
        }
        return result;
    }
}`
    },
    python: {
      notes: "Python 3 Dutch National Flag 3-way partitioning in O(N) time and O(1) space.",
      code: `# Python 3 Dutch National Flag (Sort Colors)
class Solution:
    def sortColors(self, nums: list[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        Invariants:
        [0 ... low-1]  == 0
        [low ... mid-1] == 1
        [mid ... high]  == Unprocessed
        [high+1 ... n-1] == 2
        """
        low, mid, high = 0, 0, len(nums) - 1
        
        while mid <= high:
            if nums[mid] == 0:
                nums[low], nums[mid] = nums[mid], nums[low]
                low += 1
                mid += 1
            elif nums[mid] == 1:
                mid += 1
            else: # nums[mid] == 2
                nums[mid], nums[high] = nums[high], nums[mid]
                high -= 1
                # Note: mid is NOT incremented because swapped element from high is uninspected!`
    }
  }
};

/* =========================================================================
   DAY 3: SLIDING WINDOW
   ========================================================================= */
export const day3DeepTheory: DayTheory = {
  dayNumber: 3,
  theme: "Sliding Window",
  readTimeMinutes: 14,
  markdownContent: `
# Day 3: Sliding Window — Dynamic & Fixed Subarray Invariants

> *"Sliding Window is Two Pointers constrained to contiguous sequences. Instead of recalculating properties across $\\mathcal{O}(N^2)$ subarrays, you maintain running state by adding incoming elements on the right and evicting outgoing elements from the left in $\\mathcal{O}(1)$."*

---

## 1. The Two Types of Sliding Windows

### Type 1: Fixed Window Size ($K$)
* **Signal**: "Maximum sum subarray of length $K$", "Number of anagram substrings of length $P$".
* **Template Invariant**: 
  - Grow the window until size equals $K$.
  - For each step onward: add \`nums[i]\`, subtract \`nums[i - K]\`. State update is strictly $\\mathcal{O}(1)$.

### Type 2: Variable Dynamic Window
* **Signal**: "Longest substring without repeating characters", "Shortest subarray with sum $\\ge S$".
* **Template Invariant**:
  - **Expand phase (Right pointer)**: Add elements to expand the candidate window until the condition is either satisfied or violated.
  - **Shrink phase (Left pointer)**: Advance the left pointer to restore validity or find the minimal boundary, recording the optimal answer at each valid configuration.

\`\`\`
   Window: [ Left ───────────────> Right ]
   Incoming: add right element -> update state
   Violated? -> shrink left element -> update state -> left++
\`\`\`

---

## 2. Why Sliding Window FAILS with Negative Numbers

Sliding Window strictly requires **Monotonicity**:
- Expanding right must move the state monotonically (e.g., sum only increases).
- Shrinking left must move the state monotonically (e.g., sum only decreases).

If an array contains **negative numbers**, adding \`nums[right]\` can decrease the sum, and removing \`nums[left]\` can increase it! The window can no longer determine whether shrinking or expanding will bring it closer to the target.
* **The Rule**: If the problem asks for continuous subarray sum with negatives, **Sliding Window will fail**. You must use **Prefix Sum + Hash Map** (Day 4).

---

## 3. Real-World Engineering: Sliding Window Rate Limiter

### Scenario: API Gateway DDOS Protection
At Cloudflare or Stripe, an API endpoint allows max **100 requests per 60-second window** per client IP.
- **Fixed Window Counter Flaw**: If a client sends 100 requests at $t=59\\text{s}$ and 100 requests at $t=61\\text{s}$, they send 200 requests in a 2-second interval, bypassing the limit.
- **Sliding Window Log Solution**:
  - Keep a Redis Sorted Set per IP with timestamp as score: \`ZADD rate_limit:<ip> <timestamp> <req_id>\`.
  - Evict expired timestamps: \`ZREMRANGEBYSCORE rate_limit:<ip> 0 <current_time - 60s>\`.
  - Count active requests in window: \`ZCARD rate_limit:<ip>\`.
  - If count $> 100$, reject with HTTP 429 Too Many Requests.

---

## 4. Dry Run Trace Table: Longest Substring Without Repeating Characters

String: \`s = "pwwkew"\`

| Right | Char \`s[R]\` | Previous Index in Map | \`Left\` Before | \`Left\` After | Current Window \`[L..R]\` | Window Length | Max Length |
|---|---|---|---|---|---|---|---|
| 0 | 'p' | None | 0 | 0 | "p" | 1 | 1 |
| 1 | 'w' | None | 0 | 0 | "pw" | 2 | 2 |
| 2 | 'w' | 1 ($\\ge L$) | 0 | $\\max(0, 1+1) = 2$ | "w" | 1 | 2 |
| 3 | 'k' | None | 2 | 2 | "wk" | 2 | 2 |
| 4 | 'e' | None | 2 | 2 | "wke" | 3 | **3** |
| 5 | 'w' | 2 ($\\ge L$) | 2 | $\\max(2, 2+1) = 3$ | "kew" | 3 | 3 |

Result: Maximum length is **3** ("wke"). Time: $\\mathcal{O}(N)$, Space: $\\mathcal{O}(\\min(N, \\Sigma))$.

---

## 5. Platform Traps & Gotchas

### ⚠️ The Stale Hash Map Index Bug
When jumping the left pointer:
\`\`\`python
# BUG: If the character was seen before the CURRENT window, left will move BACKWARDS!
left = last_seen[char] + 1

# CORRECT: Never let left regress backward!
left = max(left, last_seen[char] + 1)
\`\`\`

### ⚠️ ASCII Array vs Hash Map Optimization
For ASCII string problems (character set $\\le 128$ or $256$), replace \`std::unordered_map\` or \`dict\` with a fixed \`int lastPos[128]\` or \`int count[256]\` array initialized to -1 or 0. This speeds up execution by **$5\\times$ to $10\\times$** by eliminating hashing, bucket lookups, and heap allocations.
`,
  snippets: {
    cpp: {
      notes: "C++20 Longest Substring Without Repeating Characters using a direct 128-byte ASCII array table.",
      code: `// C++20 High-Speed Sliding Window with Direct Table Lookup
#include <string>
#include <vector>
#include <algorithm>

class Solution {
public:
    int lengthOfLongestSubstring(const std::string& s) {
        // Direct ASCII lookup table: eliminates hash computation overhead
        std::vector<int> lastIndex(128, -1);
        int maxLen = 0;
        int left = 0;

        for (int right = 0; right < (int)s.size(); ++right) {
            unsigned char c = s[right];
            
            // If character occurred inside current window, jump left past it
            if (lastIndex[c] >= left) {
                left = lastIndex[c] + 1;
            }
            
            lastIndex[c] = right;
            maxLen = std::max(maxLen, right - left + 1);
        }

        return maxLen;
    }
};`
    },
    java: {
      notes: "Java 21 Minimum Window Substring with frequency counter array.",
      code: `// Java 21 Minimum Window Substring
public class Solution {
    public String minWindow(String s, String t) {
        if (s.length() < t.length()) return "";

        int[] targetCounts = new int[128];
        for (char c : t.toCharArray()) targetCounts[c]++;

        int required = 0;
        for (int count : targetCounts) {
            if (count > 0) required++;
        }

        int[] windowCounts = new int[128];
        int formed = 0;
        int left = 0;
        int minLen = Integer.MAX_VALUE;
        int startIdx = 0;

        for (int right = 0; right < s.length(); right++) {
            char rChar = s.charAt(right);
            windowCounts[rChar]++;

            if (targetCounts[rChar] > 0 && windowCounts[rChar] == targetCounts[rChar]) {
                formed++;
            }

            // Shrink window from the left once all required chars are satisfied
            while (left <= right && formed == required) {
                if (right - left + 1 < minLen) {
                    minLen = right - left + 1;
                    startIdx = left;
                }

                char lChar = s.charAt(left);
                windowCounts[lChar]--;
                if (targetCounts[lChar] > 0 && windowCounts[lChar] < targetCounts[lChar]) {
                    formed--;
                }
                left++;
            }
        }

        return minLen == Integer.MAX_VALUE ? "" : s.substring(startIdx, startIdx + minLen);
    }
}`
    },
    python: {
      notes: "Python 3 sliding window dictionary implementation.",
      code: `# Python 3 Sliding Window Longest Substring Without Repeats
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last_seen: dict[str, int] = {}
        max_len = 0
        left = 0

        for right, char in enumerate(s):
            if char in last_seen and last_seen[char] >= left:
                # Jump left past the previous duplicate occurrence
                left = last_seen[char] + 1
                
            last_seen[char] = right
            max_len = max(max_len, right - left + 1)

        return max_len`
    }
  }
};

/* =========================================================================
   DAY 4: PREFIX SUMS & DIFFERENCE ARRAYS
   ========================================================================= */
export const day4DeepTheory: DayTheory = {
  dayNumber: 4,
  theme: "Prefix Sums & Difference Arrays",
  readTimeMinutes: 13,
  markdownContent: `
# Day 4: Prefix Sums & Difference Arrays — Range Query Mastery

> *"Precomputing cumulative state transforms repeated $\\mathcal{O}(N)$ range queries into instantaneous $\\mathcal{O}(1)$ calculations. Pair prefix sums with difference arrays, and batch updates become constant time."*

---

## 1. Mathematical Mechanics

### 1D Prefix Sum
Given an array $A$ of size $N$, define:

$$P[i] = \\sum_{k=0}^{i} A[k] = P[i-1] + A[i], \\quad P[-1] = 0$$

Any range sum for arbitrary interval $[L, R]$ can be calculated instantly in $\\mathcal{O}(1)$ time:

$$\\sum_{k=L}^{R} A[k] = P[R] - P[L-1]$$

### The Difference Array (Range Updates in $\\mathcal{O}(1)$)
Suppose you have an array of zeros and must apply $M$ range updates: *"Add $V$ to all elements in range $[L, R]$"*.
- Naive approach: Update each element in $[L, R]$, taking $\\mathcal{O}(M \\times N)$.
- **Difference Array $D[i] = A[i] - A[i-1]$**:
  - To add $V$ to $[L, R]$:
    $$D[L] \\mathrel{+}= V, \\quad D[R+1] \\mathrel{-}= V$$
  - After processing all $M$ updates, the final array is simply the prefix sum of $D$:
    $$A[i] = \\sum_{k=0}^{i} D[k]$$
  - Total time: $\\mathcal{O}(N + M)$ instead of $\\mathcal{O}(N \\times M)$!

---

## 2. Real-World Engineering: Airline Seat Availability & Telemetry Spikes

### Scenario: Flight Booking Capacity Manager
An airline operates a multi-hop flight route spanning 100 stations. Thousands of passengers book trips:
\`\`\`json
{ "passenger": "P12", "boardStation": 12, "exitStation": 45, "seats": 3 }
\`\`\`
The airline must guarantee that at no station does total occupancy exceed aircraft capacity (e.g. 180 seats).
- **Difference Array Solution**:
  \`\`\`cpp
  diff[boardStation] += seats;
  diff[exitStation]   -= seats; // Seats free up at exit station
  \`\`\`
- Take the running prefix sum over the stations. If at any station \`currentSeats > 180\`, immediately reject the reservation.

---

## 3. Subarray Sum Equals $K$ (Handling Negative Numbers)

Remember that sliding window fails when arrays have negative numbers. Prefix Sum solves it completely:

$$\\text{PrefixSum}[j] - \\text{PrefixSum}[i-1] = K \\iff \\text{PrefixSum}[i-1] = \\text{PrefixSum}[j] - K$$

By tracking the frequencies of all previous prefix sums in a hash map, we count all matching prior boundaries in $\\mathcal{O}(1)$ time per element.
`,
  snippets: {
    cpp: {
      notes: "C++20 Subarray Sum Equals K using Prefix Sum + Hash Map.",
      code: `// C++20 Subarray Sum Equals K (Handles Negative Numbers)
#include <vector>
#include <unordered_map>

class Solution {
public:
    int subarraySum(const std::vector<int>& nums, int k) {
        std::unordered_map<long long, int> prefixCounts;
        // Invariant: Base case for a subarray starting at index 0
        prefixCounts[0] = 1;

        long long currentSum = 0;
        int count = 0;

        for (int num : nums) {
            currentSum += num;
            long long targetPrefix = currentSum - k;

            auto it = prefixCounts.find(targetPrefix);
            if (it != prefixCounts.end()) {
                count += it->second;
            }

            prefixCounts[currentSum]++;
        }

        return count;
    }
};`
    },
    java: {
      notes: "Java 21 Difference Array for Car Pooling / Range Booking capacity check.",
      code: `// Java 21 Difference Array Technique
public class Solution {
    public boolean carPooling(int[][] trips, int capacity) {
        // Find maximum location
        int[] diff = new int[1001];

        for (int[] trip : trips) {
            int passengers = trip[0];
            int from = trip[1];
            int to = trip[2];

            diff[from] += passengers;
            diff[to] -= passengers; // Passenger leaves at destination
        }

        int currentPassengers = 0;
        for (int change : diff) {
            currentPassengers += change;
            if (currentPassengers > capacity) {
                return false;
            }
        }

        return true;
    }
}`
    },
    python: {
      notes: "Python 3 Subarray Sum Equals K with defaultdict.",
      code: `# Python 3 Subarray Sum Equals K
from collections import defaultdict

class Solution:
    def subarraySum(self, nums: list[int], k: int) -> int:
        prefix_counts: dict[int, int] = defaultdict(int)
        prefix_counts[0] = 1 # Empty prefix sum
        
        curr_sum = 0
        ans = 0
        
        for x in nums:
            curr_sum += x
            ans += prefix_counts[curr_sum - k]
            prefix_counts[curr_sum] += 1
            
        return ans`
    }
  }
};

/* =========================================================================
   DAY 5: BINARY SEARCH
   ========================================================================= */
export const day5DeepTheory: DayTheory = {
  dayNumber: 5,
  theme: "Binary Search & Search Space Reduction",
  readTimeMinutes: 14,
  markdownContent: `
# Day 5: Binary Search — The Predicate Function & Search Space Reduction

> *"Binary Search is NOT just finding a number in a sorted array. It is the art of mapping any search space to a discrete monotonic boolean function $P(x)$, then finding the exact transition boundary between false and true."*

---

## 1. The Monotonic Predicate Formulation

Given a search domain $[\\text{low}, \\text{high}]$, define a decision predicate $P(x) \\in \\{\\text{false}, \\text{true}\\}$.

If $P(x)$ is **monotonic**, the output domain looks like:

$$\\underbrace{[\\text{false}, \\text{false}, \\dots, \\text{false}]}_{\\text{infeasible}}, \\quad \\underbrace{[\\text{true}, \\text{true}, \\dots, \\text{true}]}_{\\text{feasible}}$$

Binary Search finds the **exact boundary index** where $P(x)$ flips from false to true in $\\mathcal{O}(\\log(\\text{high} - \\text{low}))$.

---

## 2. The Universal Template (Never Get an Infinite Loop Again)

Most bugs in Binary Search are off-by-one infinite loops (\`while (low <= high)\` hanging on \`low == high\`). Use this bulletproof template:

\`\`\`cpp
int low = min_possible, high = max_possible;
int ans = high;

while (low <= high) {
    int mid = low + (high - low) / 2;
    if (isValid(mid)) {
        ans = mid;        // Record candidate
        high = mid - 1;   // Try to find an even smaller feasible answer
    } else {
        low = mid + 1;    // Feasible answer must be larger
    }
}
return ans;
\`\`\`

---

## 3. Real-World Engineering: Autoscaling Cloud Clusters

### Scenario: Finding Minimum Worker Pool Size
A distributed queue receives batch jobs. Worker nodes process jobs in chunks. 
- You have $N$ jobs with varying computational costs: \`jobs = [10, 20, 30, 40, 50, 60, 70, 80, 90]\`.
- SLA mandate: All jobs must finish within $D$ hours.
- **Problem**: What is the minimum worker capacity $C$ such that all jobs finish within $D$ hours?
- **Binary Search on Answer**:
  - Search range: $\\text{low} = \\max(\\text{jobs})$, $\\text{high} = \\sum(\\text{jobs})$.
  - Predicate: \`canCompleteWithinDHours(capacity)\` takes $\\mathcal{O}(N)$ greedy checks.
  - Total time: $\\mathcal{O}(N \\log(\\sum \\text{jobs}))$.
`,
  snippets: {
    cpp: {
      notes: "C++20 Binary Search on Answer (Koko Eating Bananas pattern).",
      code: `// C++20 Binary Search on Answer
#include <vector>
#include <algorithm>
#include <cmath>

class Solution {
    bool canFinish(const std::vector<int>& piles, int speed, int h) {
        long long hoursNeeded = 0;
        for (int p : piles) {
            // Ceiling division without float: (p + speed - 1) / speed
            hoursNeeded += (p + speed - 1) / speed;
            if (hoursNeeded > h) return false;
        }
        return hoursNeeded <= h;
    }

public:
    int minEatingSpeed(const std::vector<int>& piles, int h) {
        int low = 1;
        int high = *std::max_element(piles.begin(), piles.end());
        int ans = high;

        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (canFinish(piles, mid, h)) {
                ans = mid;
                high = mid - 1; // Seek lower valid speed
            } else {
                low = mid + 1;  // Must eat faster
            }
        }

        return ans;
    }
};`
    },
    java: {
      notes: "Java 21 Binary Search rotated sorted array with boundary partition.",
      code: `// Java 21 Search in Rotated Sorted Array
public class Solution {
    public int search(int[] nums, int target) {
        int low = 0, high = nums.length - 1;

        while (low <= high) {
            int mid = low + (high - low) / 2;

            if (nums[mid] == target) return mid;

            // Determine which half is sorted
            if (nums[low] <= nums[mid]) {
                // Left half is normally sorted
                if (target >= nums[low] && target < nums[mid]) {
                    high = mid - 1;
                } else {
                    low = mid + 1;
                }
            } else {
                // Right half is normally sorted
                if (target > nums[mid] && target <= nums[high]) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
        }

        return -1;
    }
}`
    },
    python: {
      notes: "Python 3 bisect and binary search on answer template.",
      code: `# Python 3 Binary Search on Answer
class Solution:
    def shipWithinDays(self, weights: list[int], days: int) -> int:
        def can_ship(capacity: int) -> bool:
            needed_days = 1
            curr_load = 0
            for w in weights:
                if curr_load + w > capacity:
                    needed_days += 1
                    curr_load = 0
                curr_load += w
            return needed_days <= days

        low, high = max(weights), sum(weights)
        ans = high

        while low <= high:
            mid = (low + high) // 2
            if can_ship(mid):
                ans = mid
                high = mid - 1
            else:
                low = mid + 1

        return ans`
    }
  }
};

/* =========================================================================
   DAY 6: LINKED LISTS
   ========================================================================= */
export const day6DeepTheory: DayTheory = {
  dayNumber: 6,
  theme: "Linked Lists & Pointer Reversal",
  readTimeMinutes: 12,
  markdownContent: `
# Day 6: Linked Lists — Memory Invariants & Cycle Detection

> *"In an array, memory is physical and sequential. In a linked list, memory is fragmented and topological. Correctness comes entirely from pointer management and sentinel nodes."*

---

## 1. Pointer Mechanics & Sentinel Nodes

The single most effective technique for eliminating edge cases in linked lists (e.g. deleting the head, empty list, inserting at index 0) is the **Sentinel (Dummy) Node**:

\`\`\`
DummyNode (Val: 0) ──> Node(1) ──> Node(2) ──> Node(3) ──> NULL
\`\`\`

By operating on \`dummy->next\`, the head node has an identical predecessor to every other node in the list.

---

## 2. Floyd's Cycle Detection Algorithm (Tortoise and Hare)

### Proof of Convergence
Let non-cyclic prefix length be $M$ and cycle length be $C$.
1. When \`slow\` reaches the cycle entrance (after $M$ steps), \`fast\` has traveled $2M$ steps and is at some position $K = M \\pmod C$ within the cycle.
2. The relative distance between them is $(C - K) \\pmod C$.
3. In each subsequent step, \`fast\` closes the gap by $2 - 1 = 1$ node.
4. Therefore, they are **guaranteed to meet** within at most $C$ steps inside the cycle!
`,
  snippets: {
    cpp: {
      notes: "C++20 In-place Linked List Reversal.",
      code: `// C++20 In-Place Linked List Reversal
struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;

        while (curr != nullptr) {
            ListNode* nextTemp = curr->next; // 1. Save future
            curr->next = prev;               // 2. Reverse link
            prev = curr;                     // 3. Advance prev
            curr = nextTemp;                 // 4. Advance curr
        }

        return prev;
    }
};`
    },
    java: {
      notes: "Java 21 Floyd's Cycle Detection and Start Node Finder.",
      code: `// Java 21 Floyd's Tortoise and Hare Cycle Detection
public class Solution {
    public ListNode detectCycle(ListNode head) {
        if (head == null || head.next == null) return null;

        ListNode slow = head;
        ListNode fast = head;

        // Phase 1: Determine if cycle exists
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {
                // Phase 2: Find cycle entrance node
                ListNode finder = head;
                while (finder != slow) {
                    finder = finder.next;
                    slow = slow.next;
                }
                return finder;
            }
        }

        return null;
    }
}`
    },
    python: {
      notes: "Python 3 Dummy Head Merging Two Sorted Lists.",
      code: `# Python 3 Dummy Head List Merge
class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        curr = dummy

        while list1 and list2:
            if list1.val <= list2.val:
                curr.next = list1
                list1 = list1.next
            else:
                curr.next = list2
                list2 = list2.next
            curr = curr.next

        curr.next = list1 if list1 else list2
        return dummy.next`
    }
  }
};

/* =========================================================================
   DAY 7: STACKS & MONOTONIC STACKS
   ========================================================================= */
export const day7DeepTheory: DayTheory = {
  dayNumber: 7,
  theme: "Stacks & Monotonic Invariants",
  readTimeMinutes: 14,
  markdownContent: `
# Day 7: Stacks & Monotonic Stacks — LIFO Order & Next Greater Element

> *"A stack remembers past state until a dominant future element invalidates it. A monotonic stack maintains elements in strictly increasing or decreasing order, solving Next Greater Element in linear time."*

---

## 1. Monotonic Stack Mechanics

Suppose you must find the **Next Greater Element** for every item in an array:
- Brute force: For each element $i$, scan right until you find a larger element $\\implies \\mathcal{O}(N^2)$.
- **Monotonic Decreasing Stack**:
  - The stack stores elements (or their indices) in decreasing order.
  - When an incoming element \`nums[i]\` is **larger** than \`nums[stack.top()]\`, the incoming element is the next greater element for all elements smaller than it!
  - Pop all smaller elements and record \`nums[i]\` as their answer.
  - Push \`nums[i]\`.
  - Every element is pushed once and popped at most once $\\implies$ **strictly $\\mathcal{O}(N)$ total time**!

---

## 2. Real-World Engineering: AST Parsing & Real-Time Stock Span

### Scenario: Browser History & Expression Evaluator
Every programming language parser (e.g. JavaScript V8 engine) uses stacks for:
1. **Bracket and Tag Balancing** (\`{ [ ( ) ] }\`).
2. **Shunting-Yard Algorithm**: Converting human infix math (\`3 + 4 * 2\`) into Reverse Polish Notation postfix for CPU evaluation without parenthesis confusion.
`,
  snippets: {
    cpp: {
      notes: "C++20 Next Greater Element using Monotonic Stack.",
      code: `// C++20 Monotonic Stack for Next Greater Element
#include <vector>
#include <stack>

class Solution {
public:
    std::vector<int> nextGreaterElements(const std::vector<int>& nums) {
        int n = nums.size();
        std::vector<int> result(n, -1);
        std::stack<int> st; // Stores indices

        for (int i = 0; i < n; ++i) {
            while (!st.empty() && nums[st.top()] < nums[i]) {
                result[st.top()] = nums[i];
                st.pop();
            }
            st.push(i);
        }

        return result;
    }
};`
    },
    java: {
      notes: "Java 21 Daily Temperatures using ArrayDeque Monotonic Stack.",
      code: `// Java 21 Daily Temperatures
import java.util.ArrayDeque;
import java.util.Deque;

public class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] answer = new int[n];
        // ArrayDeque is significantly faster than legacy java.util.Stack
        Deque<Integer> stack = new ArrayDeque<>();

        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
                int prevDay = stack.pop();
                answer[prevDay] = i - prevDay;
            }
            stack.push(i);
        }

        return answer;
    }
}`
    },
    python: {
      notes: "Python 3 Valid Parentheses using stack.",
      code: `# Python 3 Valid Parentheses
class Solution:
    def isValid(self, s: str) -> bool:
        matching = {')': '(', '}': '{', ']': '['}
        stack = []

        for char in s:
            if char in matching:
                if not stack or stack[-1] != matching[char]:
                    return False
                stack.pop()
            else:
                stack.append(char)

        return len(stack) == 0`
    }
  }
};

const catalog: Record<number, DayTheory> = {
  1: day1DeepTheory,
  2: day2DeepTheory,
  3: day3DeepTheory,
  4: day4DeepTheory,
  5: day5DeepTheory,
  6: day6DeepTheory,
  7: day7DeepTheory,
};

export function getTheoryForDay(dayNumber: number): DayTheory {
  if (catalog[dayNumber]) {
    return catalog[dayNumber];
  }

  // Generative deep fallback for subsequent days
  return {
    dayNumber,
    theme: `Day ${dayNumber} Curriculum`,
    readTimeMinutes: 12,
    markdownContent: `
# Day ${dayNumber}: Advanced Algorithmic Patterns & Mechanics

### Core Invariant & State Reduction
Every algorithm in this section is designed to eliminate redundant computations:
1. **Identify the optimal subproblem structure**: Can past computations be indexed or reused?
2. **Formulate the state transition**: $S_{t} = f(S_{t-1}, \\text{input})$.
3. **Verify boundary conditions**: $N = 0, 1$, integer overflow risks, and negative values.

### Engineering Best Practices:
- Pre-size your collections to avoid runtime rehashing.
- Check 0-based vs 1-based indexing expectations.
- Master the time and space complexity trade-offs before writing code.
`,
    snippets: {
      cpp: {
        notes: "C++ STL implementation pattern.",
        code: `// C++ Standard Template
#include <iostream>
#include <vector>

void solve() {
    // 1. Initialize data structures
    // 2. Execute invariant loop
    // 3. Return computed result
}`
      },
      java: {
        notes: "Java 21 implementation pattern.",
        code: `// Java 21 Standard Template
public class Solution {
    public void solve() {
        // Implement optimal traversal
    }
}`
      },
      python: {
        notes: "Python 3 implementation pattern.",
        code: `# Python 3 Standard Template
def solve():
    # Maintain state invariant
    pass`
      }
    }
  };
}

import { ProblemService } from "../src/services/problem.service.js";
import { CurriculumService } from "../src/services/curriculum.service.js";
import { MCQService } from "../src/services/mcq.service.js";
import { LibraryService } from "../src/services/library.service.js";
import { getFirestoreDb } from "../src/db/firestore.js";

export async function seedBaselineData(db = getFirestoreDb()) {
  const problemService = new ProblemService(db);
  const curriculumService = new CurriculumService(db);
  const mcqService = new MCQService(db);
  const libraryService = new LibraryService(db);

  console.log("Seeding Problems...");
  await problemService.batchUpsert([
    {
      id: "lc_1",
      platform: "LC",
      externalId: "1",
      title: "Two Sum",
      url: "https://leetcode.com/problems/two-sum/",
      difficulty: "Easy",
      tags: ["Arrays", "Hash Table"],
      hint: "Use a hash map to store seen values and look up complement in O(1) time.",
      expectedTimeComplexity: "O(N)",
      expectedSpaceComplexity: "O(N)",
      expectedPattern: "Hash Map Complement Lookup",
    },
    {
      id: "lc_217",
      platform: "LC",
      externalId: "217",
      title: "Contains Duplicate",
      url: "https://leetcode.com/problems/contains-duplicate/",
      difficulty: "Easy",
      tags: ["Arrays", "Hash Table"],
      hint: "Track visited elements in a hash set.",
      expectedTimeComplexity: "O(N)",
      expectedSpaceComplexity: "O(N)",
      expectedPattern: "Hash Set Existence Check",
    },
    {
      id: "lc_49",
      platform: "LC",
      externalId: "49",
      title: "Group Anagrams",
      url: "https://leetcode.com/problems/group-anagrams/",
      difficulty: "Medium",
      tags: ["Arrays", "Hash Table", "Strings"],
      hint: "Use sorted string or character frequency tuple as the hash map key.",
      expectedTimeComplexity: "O(N * K log K)",
      expectedSpaceComplexity: "O(N * K)",
      expectedPattern: "Hash Map Canonical Key Grouping",
    },
    {
      id: "cf_1850A",
      platform: "CF",
      externalId: "1850A",
      title: "To My Critics",
      url: "https://codeforces.com/problemset/problem/1850/A",
      difficulty: "800",
      tags: ["math", "brute force"],
      hint: "Check all three pairs among three integers to see if sum >= 10.",
      expectedTimeComplexity: "O(1)",
      expectedSpaceComplexity: "O(1)",
      expectedPattern: "Brute Force Pairwise Check",
    },
    {
      id: "cf_158B",
      platform: "CF",
      externalId: "158B",
      title: "Taxi",
      url: "https://codeforces.com/problemset/problem/158/B",
      difficulty: "1100",
      tags: ["greedy", "special problem"],
      hint: "Count groups of 4, 3, 2, 1 and greedily combine them into capacity-4 taxis.",
      expectedTimeComplexity: "O(N)",
      expectedSpaceComplexity: "O(1)",
      expectedPattern: "Greedy Bin Packing",
    },
  ]);

  console.log("Seeding Curriculum Days...");
  await curriculumService.batchUpsertDays([
    {
      id: "day_1",
      number: 1,
      theme: "Arrays & Hashing",
      summary: "Foundational pattern: direct indexing, hash table lookups in O(1) amortized, and avoiding O(N^2) brute force scans.",
      theoryContent: `# Day 1: Arrays & Hashing

## Core Principle
Arrays provide O(1) direct random access by index, but search takes O(N). Hash tables trade O(N) space to achieve O(1) average lookup, insertion, and deletion.

### Language Nuances
- **Java**: \`HashMap<K, V>\` uses separate chaining with red-black trees when bucket sizes exceed 8. Remember that primitive autoboxing (\`int\` to \`Integer\`) incurs memory overhead.
- **C++**: \`std::unordered_map\` uses hash buckets. Beware: on Codeforces, anti-hash tests intentionally trigger O(N^2) worst-case collisions unless you use a custom randomized hash like \`custom_hash\` with \`splitmix64\`.
- **Python**: \`dict\` is highly optimized and maintains insertion order since Python 3.7. Beware recursion limits on recursive DFS.
`,
      strictOrder: 1,
      problemIds: ["lc_1", "lc_217", "lc_49", "cf_1850A", "cf_158B"],
    },
  ]);

  console.log("Seeding Day 1 MCQs with Solutions...");
  await mcqService.batchUpsertQuestions([
    {
      id: "mcq_day1_1",
      dayId: "day_1",
      topic: "Hash Map Collisions & Anti-Hash Exploits",
      question:
        "In C++, what is the worst-case time complexity of inserting N elements into std::unordered_map if all keys hash to the same bucket?",
      codeSnippet: "std::unordered_map<int, int> mp;\nfor(int i = 0; i < n; i++) mp[i] = i;",
      options: [
        { key: "A", text: "O(1) amortized" },
        { key: "B", text: "O(log N)" },
        { key: "C", text: "O(N^2) total (O(N) per insertion)" },
        { key: "D", text: "O(N log N)" },
      ],
      correctOption: "C",
      detailedExplanation:
        "Correct Answer: C. When every key hashes to the same bucket in std::unordered_map, the bucket behaves like a linear linked list. Each insertion must traverse the entire chain to check for duplicate keys, taking O(k) for the k-th insertion. Summing 1 + 2 + ... + N results in O(N^2) total time. On Codeforces, anti-hash tests specifically exploit this to cause Time Limit Exceeded (TLE) unless custom randomized hashers like custom_hash with splitmix64 are used.",
      difficulty: "medium",
      orderIndex: 1,
    },
    {
      id: "mcq_day1_2",
      dayId: "day_1",
      topic: "Two Sum Pattern Optimization",
      question:
        "Why is a single-pass hash table preferred over sorting and two pointers for LeetCode #1 (Two Sum)?",
      codeSnippet: null,
      options: [
        { key: "A", text: "Sorting takes O(N log N) and loses original indices without extra index tracking." },
        { key: "B", text: "Two pointers cannot handle negative integers." },
        { key: "C", text: "Hash maps use zero extra auxiliary space." },
        { key: "D", text: "Two pointers require O(N^2) time complexity." },
      ],
      correctOption: "A",
      detailedExplanation:
        "Correct Answer: A. Sorting the array takes O(N log N) time and alters the original element indices, requiring us to store (value, originalIndex) pairs. A single-pass hash map solves the problem in O(N) time and O(N) space while directly preserving and returning the original indices without modifying the array.",
      difficulty: "easy",
      orderIndex: 2,
    },
  ]);

  console.log("Seeding Library Pages...");
  await libraryService.createOrUpdatePage({
    slug: "os/deadlocks",
    section: "os",
    title: "Deadlocks: Necessary Conditions & Banker's Algorithm",
    orderIndex: 1,
    tags: ["OS", "Concurrency", "Synchronization"],
    readTimeMinutes: 10,
    content: `# Deadlocks in Operating Systems

A deadlock is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process.

## The 4 Necessary Coffman Conditions
1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode.
2. **Hold and Wait**: A process must be holding at least one resource and waiting to acquire additional resources.
3. **No Preemption**: Resources cannot be preempted; they can only be released voluntarily.
4. **Circular Wait**: A closed chain of processes exists such that each process holds at least one resource needed by the next.
`,
    interviewQuestions: [
      {
        q: "What is the difference between Deadlock Prevention and Deadlock Avoidance?",
        a: "Deadlock Prevention eliminates at least one of the 4 Coffman conditions statically before execution. Deadlock Avoidance dynamically inspects resource allocation state (e.g., Banker's Algorithm) to ensure the system never enters an unsafe state.",
      },
    ],
  });

  console.log("Seeding completed successfully.");
}


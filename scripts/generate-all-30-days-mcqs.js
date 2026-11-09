import fs from "node:fs";
import path from "node:path";

const all30Themes = [
  { day: 1, theme: "Arrays & Hash Maps", tags: ["Hashing", "Arrays"] },
  { day: 2, theme: "Two Pointers", tags: ["Two Pointers", "Sorting"] },
  { day: 3, theme: "Sliding Window", tags: ["Sliding Window", "Subarrays"] },
  { day: 4, theme: "Prefix Sums & Difference Arrays", tags: ["Prefix Sum", "Difference Array"] },
  { day: 5, theme: "Binary Search on Arrays", tags: ["Binary Search", "Bounds"] },
  { day: 6, theme: "Binary Search on Answer Space", tags: ["Binary Search", "Monotonicity"] },
  { day: 7, theme: "Bit Manipulation & Fast Math", tags: ["Bitmask", "Math"] },
  { day: 8, theme: "Stacks & Monotonic Stack", tags: ["Stack", "Monotonic Stack"] },
  { day: 9, theme: "Queues & Monotonic Deque", tags: ["Queue", "Deque"] },
  { day: 10, theme: "Linked List Patterns", tags: ["Linked List", "Fast Slow"] },
  { day: 11, theme: "Recursion & Backtracking", tags: ["Recursion", "Backtracking"] },
  { day: 12, theme: "Binary Trees: DFS & Paths", tags: ["Trees", "DFS"] },
  { day: 13, theme: "Binary Trees: BFS & Views", tags: ["Trees", "BFS"] },
  { day: 14, theme: "Binary Search Trees", tags: ["BST", "Trees"] },
  { day: 15, theme: "Heaps & Priority Queues", tags: ["Heap", "Priority Queue"] },
  { day: 16, theme: "Greedy Algorithms", tags: ["Greedy", "Intervals"] },
  { day: 17, theme: "Dynamic Programming: 1D Basics", tags: ["DP", "1D DP"] },
  { day: 18, theme: "Dynamic Programming: State Machine", tags: ["DP", "LIS"] },
  { day: 19, theme: "Dynamic Programming: 2D Grids", tags: ["DP", "Grid DP"] },
  { day: 20, theme: "Dynamic Programming: Knapsack", tags: ["DP", "Knapsack"] },
  { day: 21, theme: "Dynamic Programming: Strings", tags: ["DP", "LCS"] },
  { day: 22, theme: "Graph Fundamentals: BFS & DFS", tags: ["Graph", "BFS", "DFS"] },
  { day: 23, theme: "Matrix as Graph", tags: ["Graph", "Matrix Flood Fill"] },
  { day: 24, theme: "Topological Sort & DAGs", tags: ["Graph", "Topological Sort"] },
  { day: 25, theme: "Shortest Path: Dijkstra", tags: ["Graph", "Dijkstra"] },
  { day: 26, theme: "Disjoint Set Union", tags: ["DSU", "Union Find"] },
  { day: 27, theme: "Tries (Prefix Trees)", tags: ["Trie", "String Data Structure"] },
  { day: 28, theme: "Intervals & Sweep Line", tags: ["Intervals", "Sweep Line"] },
  { day: 29, theme: "String Matching & Rolling Hash", tags: ["String", "Rabin Karp", "KMP"] },
  { day: 30, theme: "Grand Integration & Review", tags: ["System Integration", "Data Structures"] },
];

const questionArchetypes = [
  { focus: "Time Complexity Invariant", q: "What is the tightest time complexity bound for the optimal pattern?", correct: "A", explanation: "The optimal approach processes each element in amortized constant time O(1), achieving O(N) overall." },
  { focus: "Space Complexity Bound", q: "What is the worst-case auxiliary space complexity?", correct: "B", explanation: "The auxiliary space is bounded by O(N) to store state tracking collections or recursion depth." },
  { focus: "Language Specifics (Java)", q: "In Java, what is a key memory or performance consideration?", correct: "A", explanation: "Primitive types should be used instead of wrapper classes (e.g. int[] vs ArrayList<Integer>) to prevent object boxing overhead." },
  { focus: "Language Specifics (C++)", q: "In C++, what trap must be avoided on competitive programming platforms?", correct: "C", explanation: "Avoid worst-case hash collisions by providing custom randomized hashers (e.g. splitmix64), and use '\\n' instead of std::endl." },
  { focus: "Language Specifics (Python)", q: "In Python, what is a crucial operational detail?", correct: "D", explanation: "Ensure recursion depth is elevated with sys.setrecursionlimit(300000) or convert deep recursive calls to an explicit stack." },
  { focus: "Edge Case: Empty or Single Element", q: "How should the algorithm handle input size N <= 1?", correct: "A", explanation: "Boundary guard checks must handle empty or single-element inputs immediately before pointer initialization." },
  { focus: "Edge Case: Duplicates & Collisions", q: "How does the algorithm maintain correctness when duplicate values occur?", correct: "B", explanation: "Explicit equality checks and strict index progression prevent infinite loops and duplicate count inflation." },
  { focus: "State Transition Integrity", q: "What invariant must hold true across every step of iteration?", correct: "A", explanation: "The window/pointer/stack invariant must be strictly preserved before expanding the next element." },
  { focus: "Integer Overflow Prevention", q: "When computing indices or accumulated sums, how is integer overflow prevented?", correct: "C", explanation: "Use 64-bit integers (long in Java, long long in C++) and mid = low + (high - low)/2." },
  { focus: "When NOT to Use", q: "When is this technique NOT suitable and likely to cause incorrect results?", correct: "D", explanation: "When the problem requires non-contiguous global backtracking or lacks the underlying monotonicity/subproblem property." },
  { focus: "Amortized Runtime Proof", q: "Why does the inner loop not cause O(N^2) total execution time?", correct: "A", explanation: "Because the pointer or element is processed and popped at most once across the entire traversal, yielding O(2N) = O(N)." },
  { focus: "Dry Run Trace", q: "In a standard dry run with inputs [1, 2, 3], what occurs during the first step?", correct: "B", explanation: "The initial boundary element is recorded into the state container, establishing the base invariant." },
  { focus: "Data Structure Selection", q: "Which data structure is optimal for backing this pattern?", correct: "C", explanation: "The chosen collection provides O(1) peek and update operations to satisfy tight real-time constraints." },
  { focus: "Recursion Stack Limit", q: "What is the risk of deeply nested calls in this pattern?", correct: "A", explanation: "Deep recursion risks call stack overflow (SIGSEGV in C++, StackOverflowError in Java). An explicit stack mitigates this." },
  { focus: "Monotonicity Requirement", q: "Why is monotonicity essential for this algorithm?", correct: "B", explanation: "Monotonicity ensures that a binary decision definitively eliminates half of the search or state space." },
  { focus: "Fast I/O Interaction", q: "For 10^5 queries of this type, which input method is required?", correct: "A", explanation: "BufferedReader in Java, cin.tie(NULL) in C++, and sys.stdin.readline in Python to avoid I/O bottlenecks." },
  { focus: "Bitwise Optimizations", q: "How can constant-factor speed be improved with bit operations?", correct: "C", explanation: "Using power-of-two bitwise masking (x & (C - 1)) eliminates slow modulo division." },
  { focus: "Two Heaps / Split State", q: "When dividing elements into two halves, what balance condition is enforced?", correct: "B", explanation: "The size difference between the two halves must never exceed 1." },
  { focus: "Cycle Detection Mechanics", q: "How does the runner technique detect cycles without extra memory?", correct: "A", explanation: "The relative speed difference between fast and slow guarantees they meet within the cycle in O(N) time." },
  { focus: "Interview Communication", q: "What should a candidate state to the interviewer before writing code for this pattern?", correct: "D", explanation: "Clarify constraints, discuss space-time trade-offs, state assumptions, and dry run an edge-case example." }
];

export function generateAll30DaysMCQs() {
  const masterList = [];

  for (const dayObj of all30Themes) {
    const dayId = `day_${dayObj.day}`;

    for (let i = 0; i < 20; i++) {
      const arch = questionArchetypes[i];
      const qId = `${dayId}_mcq_${i + 1}`;

      const options = [
        { key: "A", text: arch.correct === "A" ? arch.explanation : `Greedy local choice always guarantees global optimum without constraints in ${dayObj.theme}.` },
        { key: "B", text: arch.correct === "B" ? arch.explanation : `Requires quadratic O(N^2) memory buffer allocation in ${dayObj.theme}.` },
        { key: "C", text: arch.correct === "C" ? arch.explanation : `Can only be executed on 64-bit Linux kernels.` },
        { key: "D", text: arch.correct === "D" ? arch.explanation : `Fails if the input contains negative values or zeros.` }
      ];

      masterList.push({
        id: qId,
        dayId,
        topic: `${dayObj.theme} - ${arch.focus}`,
        question: `[Day ${dayObj.day}: ${dayObj.theme}] ${arch.q}`,
        codeSnippet: i % 3 === 0 ? `// Day ${dayObj.day} pattern snippet (${dayObj.theme})\nvoid process() {\n  // Invariant verification for ${arch.focus}\n}` : null,
        options,
        correctOption: arch.correct,
        detailedExplanation: `Correct Answer: ${arch.correct}. In Day ${dayObj.day} (${dayObj.theme}), ${arch.focus} is a key concept. ${arch.explanation}`,
        difficulty: i < 7 ? "easy" : i < 15 ? "medium" : "hard",
        orderIndex: i + 1
      });
    }
  }

  return masterList;
}

const outDir = path.resolve("./data/mcqs");
const allQuestions = generateAll30DaysMCQs();
fs.writeFileSync(path.join(outDir, "all_30_days_mcqs.json"), JSON.stringify(allQuestions, null, 2));
console.log(`Generated ${allQuestions.length} MCQs (exactly 20 per day across all 30 days) into data/mcqs/all_30_days_mcqs.json`);


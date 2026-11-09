import fs from "node:fs";
import path from "node:path";

export const patternDecisionTree = {
  title: "Algorithmic Interview Pattern Recognition Decision Tree",
  description: "A mental decision framework mapping problem constraints and clues to optimal data structure and algorithm patterns.",
  categories: [
    {
      category: "Subarray & Substring Problems",
      decisionFlow: [
        {
          clue: "Problem asks for contiguous subarray/substring with sum/length condition.",
          branches: [
            {
              condition: "All elements are strictly non-negative (>= 0)?",
              recommendation: "Sliding Window (Two Pointers)",
              timeComplexity: "O(N)",
              spaceComplexity: "O(1)",
              rationale: "Monotonicity holds: expanding the right boundary strictly increases sum, shrinking left boundary strictly decreases sum."
            },
            {
              condition: "Elements can be negative (contains positive and negative numbers)?",
              recommendation: "Prefix Sum + Hash Map (e.g. Subarray Sum Equals K)",
              timeComplexity: "O(N)",
              spaceComplexity: "O(N)",
              rationale: "Sliding window FAILS on negative numbers because shrinking left can either increase or decrease the sum. Use prefix[i] - target in map."
            },
            {
              condition: "Maximum contiguous sum (no target constraint)?",
              recommendation: "Kadane's Algorithm",
              timeComplexity: "O(N)",
              spaceComplexity: "O(1)",
              rationale: "Local choice: maxCurrent = max(num, maxCurrent + num)."
            }
          ]
        }
      ]
    },
    {
      category: "Sorted Arrays & Two Sum Family",
      decisionFlow: [
        {
          clue: "Problem asks to find pair/triplet meeting a condition in an array.",
          branches: [
            {
              condition: "Array is already sorted or sorting is permitted within O(N log N)?",
              recommendation: "Two Pointers (Converging from both ends)",
              timeComplexity: "O(N log N) if unsorted, O(N) if pre-sorted",
              spaceComplexity: "O(1)",
              rationale: "Avoids hash map allocation; easily skips duplicate values for 3Sum and 4Sum."
            },
            {
              condition: "Original array indices MUST be preserved, or array cannot be sorted?",
              recommendation: "Hash Map (Complement Lookup)",
              timeComplexity: "O(N)",
              spaceComplexity: "O(N)",
              rationale: "Lookup target - num in O(1) time without modifying input array."
            }
          ]
        }
      ]
    },
    {
      category: "K-th Element & Running Extremes",
      decisionFlow: [
        {
          clue: "Find K-th largest / smallest element or running median in a stream.",
          branches: [
            {
              condition: "Fixed static array where K is small compared to N?",
              recommendation: "Min-Heap of size K (for Kth largest) or Quickselect",
              timeComplexity: "O(N log K) with heap, O(N) average with Quickselect",
              spaceComplexity: "O(K)",
              rationale: "Min-heap keeps K largest; root is the Kth largest."
            },
            {
              condition: "Continuous stream with dynamic median requests?",
              recommendation: "Two Balanced Heaps (Max-Heap for lower half, Min-Heap for upper half)",
              timeComplexity: "O(log N) insert, O(1) median query",
              spaceComplexity: "O(N)",
              rationale: "Maintain size difference <= 1 between lower and upper heaps."
            }
          ]
        }
      ]
    },
    {
      category: "Graph Shortest Path & Traversal",
      decisionFlow: [
        {
          clue: "Find shortest distance between nodes in a graph.",
          branches: [
            {
              condition: "Unweighted graph or all edge weights equal?",
              recommendation: "Breadth-First Search (BFS) using a Queue",
              timeComplexity: "O(V + E)",
              spaceComplexity: "O(V)",
              rationale: "BFS expands in concentric distance rings, guaranteeing shortest path upon first arrival."
            },
            {
              condition: "Weighted graph with strictly non-negative edge weights?",
              recommendation: "Dijkstra's Algorithm with Min-Heap",
              timeComplexity: "O((V + E) log V)",
              spaceComplexity: "O(V + E)",
              rationale: "Greedily relaxes shortest tentative distances."
            },
            {
              condition: "Graph contains negative edge weights or negative cycle detection required?",
              recommendation: "Bellman-Ford Algorithm (or SPFA)",
              timeComplexity: "O(V * E)",
              spaceComplexity: "O(V)",
              rationale: "Relaxes all edges V - 1 times."
            }
          ]
        }
      ]
    },
    {
      category: "Dynamic Programming: When is it DP?",
      decisionFlow: [
        {
          clue: "Ask: Can the problem be solved with Greedy? If not, check DP preconditions.",
          branches: [
            {
              condition: "Overlapping subproblems + Optimal substructure (decision at step i depends on previous steps)?",
              recommendation: "Dynamic Programming (Top-Down Memoization or Bottom-Up Tabulation)",
              timeComplexity: "O(number of states * transitions)",
              spaceComplexity: "O(number of states), often reducible to O(1) or O(column)",
              rationale: "State definition: What minimal information uniquely describes a subproblem?"
            },
            {
              condition: "Subset choice with item weights and maximum capacity?",
              recommendation: "0/1 Knapsack (reverse loop) or Unbounded Knapsack (forward loop)",
              timeComplexity: "O(N * Capacity)",
              spaceComplexity: "O(Capacity)",
              rationale: "Reverse iteration prevents reusing the same item in 0/1 knapsack."
            }
          ]
        }
      ]
    }
  ]
};

const outDir = path.resolve("./data/practice");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, "pattern_decision_tree.json"), JSON.stringify(patternDecisionTree, null, 2));
console.log(`Generated Pattern Decision Tree into data/practice/pattern_decision_tree.json`);


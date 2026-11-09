import fs from "node:fs";
import path from "node:path";

export const languageMasterNotes = {
  overview: "Side-by-side technical reference for Java, C++, and Python in Technical Interviews & Competitive Programming.",
  sections: [
    {
      category: "Dynamic Array",
      concept: "Contiguous resizable memory array with O(1) random access by index.",
      java: {
        structure: "ArrayList<T>",
        declaration: "List<Integer> list = new ArrayList<>();",
        insertEnd: "list.add(val); // O(1) amortized",
        insertMiddle: "list.add(index, val); // O(N)",
        deleteEnd: "list.remove(list.size() - 1); // O(1)",
        deleteMiddle: "list.remove(index); // O(N)",
        search: "list.get(index); // O(1) by index, O(N) by value",
        pros: "Type-safe, seamlessly integrates with Collections.sort() and Java Streams.",
        cons: "Primitives incur boxing overhead (ArrayList<Integer> stores 24-byte Integer object references instead of 4-byte raw ints). For high-throughput CP, primitive int[] or FastIntArray is preferred.",
        pitfalls: "Calling list.remove(1) removes index 1, NOT the integer value 1! To remove value 1, you must call list.remove(Integer.valueOf(1))."
      },
      cpp: {
        structure: "std::vector<T>",
        declaration: "vector<int> vec;",
        insertEnd: "vec.push_back(val); // or vec.emplace_back(val); O(1) amortized",
        insertMiddle: "vec.insert(vec.begin() + index, val); // O(N)",
        deleteEnd: "vec.pop_back(); // O(1)",
        deleteMiddle: "vec.erase(vec.begin() + index); // O(N)",
        search: "vec[index]; // O(1) without bounds check; vec.at(index) with bounds check",
        pros: "Direct contiguous raw memory with zero boxing overhead. Highest cache locality and SIMD vectorization potential.",
        cons: "Reallocation invalidates existing pointers and iterators.",
        pitfalls: "Calling `vec.size() - 1` when vec is empty causes integer underflow because `size()` returns `size_t` (unsigned 64-bit integer), wrapping to 18446744073709551615!"
      },
      python: {
        structure: "list",
        declaration: "arr = []",
        insertEnd: "arr.append(val) # O(1) amortized",
        insertMiddle: "arr.insert(index, val) # O(N)",
        deleteEnd: "arr.pop() # O(1)",
        deleteMiddle: "del arr[index] # O(N)",
        search: "arr[index] # O(1)",
        pros: "Extremely expressive syntax (slicing arr[::-1], list comprehensions [x*2 for x in arr]).",
        cons: "High memory overhead (~8 bytes per pointer + PyObject overhead). Slower loop execution speed on competitive programming platforms.",
        pitfalls: "Creating a 2D matrix via `[[0]*M]*N` creates N references to the EXACT SAME list in memory! Modifying `mat[0][0] = 1` mutates all rows! Always use `[[0]*M for _ in range(N)]`."
      }
    },
    {
      category: "Hash Table / Map",
      concept: "Key-value mapping providing O(1) average lookup, insertion, and deletion.",
      java: {
        structure: "HashMap<K, V>",
        declaration: "Map<Integer, Integer> map = new HashMap<>();",
        insert: "map.put(key, val); // O(1) average",
        delete: "map.remove(key); // O(1) average",
        search: "map.get(key); // O(1) average, returns null if missing",
        iteration: "for (Map.Entry<K, V> e : map.entrySet()) { ... }",
        pros: "Since Java 8, hash buckets that exceed 8 entries convert from linked lists to Red-Black balanced trees (O(log K) worst case), providing strong defense against collision attacks.",
        cons: "Heavy memory footprint: each Map.Entry node object has ~32 bytes overhead.",
        pitfalls: "Keys must properly override BOTH `equals()` and `hashCode()`. Overriding only one breaks hash bucket lookup silently."
      },
      cpp: {
        structure: "std::unordered_map<K, V>",
        declaration: "unordered_map<int, int> mp;",
        insert: "mp[key] = val; // or mp.insert({key, val}); O(1) average",
        delete: "mp.erase(key); // O(1) average",
        search: "mp.find(key); // returns mp.end() if missing",
        iteration: "for (auto& [k, v] : mp) { ... }",
        pros: "Fastest raw execution speed under normal random hashing conditions.",
        cons: "Worst-case insertion is O(N) because std::unordered_map uses standard linked list chaining.",
        pitfalls: "CRITICAL CODEFORCES TRAP: Codeforces users routinely craft test cases targeting `std::hash<long long>` (which is identity function `x % prime`). This causes all N elements to collide in bucket 0, degrading runtime to O(N^2) and causing Time Limit Exceeded (TLE). Always use a custom randomized hash like splitmix64!"
      },
      python: {
        structure: "dict",
        declaration: "d = {}",
        insert: "d[key] = val # O(1) average",
        delete: "del d[key] # or d.pop(key)",
        search: "d.get(key, default_val) # O(1)",
        iteration: "for k, v in d.items(): ...",
        pros: "Since Python 3.7, dictionaries are guaranteed to maintain insertion order while retaining O(1) lookup.",
        cons: "Slightly higher memory than C++ unordered_map.",
        pitfalls: "Keys must be immutable (hashable). Attempting to use a mutable list as a dictionary key raises `TypeError: unhashable type: 'list'`. Use tuples `tuple(list)` instead."
      }
    },
    {
      category: "Priority Queue / Heap",
      concept: "Complete binary tree maintaining min or max element at root in O(1) access, O(log N) push/pop.",
      java: {
        structure: "PriorityQueue<T>",
        declaration: "PriorityQueue<Integer> pq = new PriorityQueue<>(); // Min-heap by default\n// Max-heap: new PriorityQueue<>(Collections.reverseOrder());",
        insert: "pq.offer(val); // O(log N)",
        pop: "pq.poll(); // O(log N), returns null if empty",
        peek: "pq.peek(); // O(1)",
        pros: "Supports custom comparators easily: `new PriorityQueue<>((a, b) -> a[0] - b[0])`.",
        cons: "Does not support decrease-key in O(log N) (remove(obj) is O(N)).",
        pitfalls: "Using `(a, b) -> a - b` can cause integer overflow when subtracting large positive and negative numbers. Always use `Integer.compare(a, b)`."
      },
      cpp: {
        structure: "std::priority_queue<T>",
        declaration: "priority_queue<int> pq; // MAX-heap by default!\n// Min-heap: priority_queue<int, vector<int>, greater<int>> min_pq;",
        insert: "pq.push(val); // O(log N)",
        pop: "pq.pop(); // O(log N), returns void!",
        peek: "pq.top(); // O(1)",
        pros: "Very fast cache-friendly contiguous array-backed binary heap.",
        cons: "Default is MAX-heap (opposite of Java and Python!).",
        pitfalls: "`pq.pop()` does NOT return the top element—it returns void! You must call `int top = pq.top();` first and then `pq.pop();`."
      },
      python: {
        structure: "heapq module",
        declaration: "import heapq\nh = [] # Min-heap by default",
        insert: "heapq.heappush(h, val) # O(log N)",
        pop: "heapq.heappop(h) # O(log N)",
        peek: "h[0] # O(1)",
        pros: "Transforms any standard Python list into a heap in-place in O(N) time using `heapq.heapify(h)`.",
        cons: "Only supports min-heap natively.",
        pitfalls: "To implement a max-heap in Python, you must invert values (`-val`) on push and pop, or store tuples `(-priority, item)`. If storing tuples where priorities are equal, items must be comparable; otherwise pass unique index `(priority, index, item)`."
      }
    },
    {
      category: "Fast I/O & Competitive Programming Essentials",
      concept: "Optimizing input and output streams to handle up to 10^6 lines of text without TLE.",
      java: {
        snippet: `import java.io.*;
import java.util.*;

public class FastIO {
    static class FastReader {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st;
        String next() {
            while (st == null || !st.hasMoreElements()) {
                try { st = new StringTokenizer(br.readLine()); }
                catch (IOException e) { e.printStackTrace(); }
            }
            return st.nextToken();
        }
        int nextInt() { return Integer.parseInt(next()); }
        long nextLong() { return Long.parseLong(next()); }
    }
    public static void main(String[] args) {
        FastReader in = new FastReader();
        PrintWriter out = new PrintWriter(new BufferedOutputStream(System.out));
        int n = in.nextInt();
        out.println(n);
        out.flush(); // Crucial to flush buffer at end!
    }
}`,
        pitfall: "Scanner uses regex matching internally and is 10x to 20x slower than BufferedReader. Avoid System.out.println() in large loops; use PrintWriter or StringBuilder."
      },
      cpp: {
        snippet: `#include <bits/stdc++.h>
using namespace std;

// Custom Randomized Hash to prevent Codeforces Anti-Hash Hacks
struct custom_hash {
    static uint64_t splitmix64(uint64_t x) {
        x += 0x9e3779b97f4a7c15;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9;
        x = (x ^ (x >> 27)) * 0x94d049bb133111eb;
        return x ^ (x >> 31);
    }
    size_t operator()(uint64_t x) const {
        static const uint64_t FIXED_RANDOM = chrono::steady_clock::now().time_since_epoch().count();
        return splitmix64(x + FIXED_RANDOM);
    }
};

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    unordered_map<long long, int, custom_hash> safe_map;
    return 0;
}`,
        pitfall: "`std::endl` flushes the stream on every single line, turning O(N) output into O(N) blocking system calls. Always use `'\\n'` instead of `std::endl`."
      },
      python: {
        snippet: `import sys

# Fast I/O
input = sys.stdin.readline

# Increase recursion depth for deep graph DFS / tree traversals
sys.setrecursionlimit(300000)

def main():
    line = input().strip()
    # sys.stdout.write(str(ans) + '\\n') for fastest output
`,
        pitfall: "Default recursion limit in Python is only 1,000 frames. Deep DFS on trees with N = 10^5 will crash with RecursionError. Always call `sys.setrecursionlimit(300000)` or rewrite recursion iteratively."
      }
    }
  ]
};

const outDir = path.resolve("./data/theory");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
fs.writeFileSync(path.join(outDir, "language_master_notes.json"), JSON.stringify(languageMasterNotes, null, 2));
console.log(`Generated Language Master Notes comparing Java, C++, and Python into data/theory/language_master_notes.json`);

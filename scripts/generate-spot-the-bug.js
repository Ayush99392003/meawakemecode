import fs from "node:fs";
import path from "node:path";

export const spotTheBugChallenges = [
  {
    id: "bug_1",
    title: "Binary Search Integer Overflow",
    category: "Binary Search",
    language: "Java / C++",
    buggyCode: `int mid = (low + high) / 2;
if (nums[mid] == target) return mid;`,
    bugDescription: "Integer overflow in calculating midpoint.",
    whyItBreaks: "When low and high are both large positive integers (e.g., low = 1.5 * 10^9, high = 2.0 * 10^9), their sum exceeds 2^31 - 1 (2,147,483,647), wrapping around to a negative number. This results in mid < 0, triggering an ArrayIndexOutOfBoundsException or illegal memory access.",
    fixedCode: `int mid = low + (high - low) / 2;
if (nums[mid] == target) return mid;`
  },
  {
    id: "bug_2",
    title: "Binary Search Off-by-One Loop Condition",
    category: "Binary Search",
    language: "All",
    buggyCode: `int low = 0, high = nums.length - 1;
while (low < high) { // BUG HERE
    int mid = low + (high - low) / 2;
    if (nums[mid] == target) return mid;
    else if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
}
return -1;`,
    bugDescription: "Misses single-element match or target at final remaining element.",
    whyItBreaks: "If nums has 1 element [5] and target is 5, low = 0, high = 0. The while condition (low < high) evaluates to (0 < 0) == false! The loop never executes, and the function incorrectly returns -1.",
    fixedCode: `int low = 0, high = nums.length - 1;
while (low <= high) { // FIXED: <=
    int mid = low + (high - low) / 2;
    if (nums[mid] == target) return mid;
    else if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
}
return -1;`
  },
  {
    id: "bug_3",
    title: "Python 2D List Reference Duplication",
    category: "Arrays / Memory",
    language: "Python",
    buggyCode: `dp = [[0] * M] * N # BUG: Shallow reference duplication
dp[0][0] = 1
print(dp) # Surprise: All rows at index 0 are now 1!`,
    bugDescription: "Multiplying a list copies the list reference, not the list contents.",
    whyItBreaks: "The expression creates N references to the EXACT SAME list in memory. Modifying any cell `dp[r][c]` mutates that cell across all N rows simultaneously.",
    fixedCode: `dp = [[0] * M for _ in range(N)] # FIXED: Independent list comprehension
dp[0][0] = 1`
  },
  {
    id: "bug_4",
    title: "Java List.remove() Primitive vs Index",
    category: "Collections",
    language: "Java",
    buggyCode: `List<Integer> list = new ArrayList<>();
list.add(5); list.add(1); list.add(3);
list.remove(1); // Intent: remove value 1`,
    bugDescription: "Invokes List.remove(int index) instead of List.remove(Object o).",
    whyItBreaks: "Because 1 is an integer literal, Java selects the overloaded `remove(int index)` method, deleting the element at index 1 (which is 1), but if the list was `[10, 20, 1]`, `list.remove(1)` deletes 20! It removes index 1, not value 1.",
    fixedCode: `list.remove(Integer.valueOf(1)); // FIXED: Explicitly box to Object to match remove(Object o)`
  },
  {
    id: "bug_5",
    title: "C++ Unsigned size() Underflow",
    category: "Vectors",
    language: "C++",
    buggyCode: `vector<int> nums;
for (int i = 0; i <= nums.size() - 1; i++) { // BUG on empty vector
    cout << nums[i];
}`,
    bugDescription: "Unsigned integer underflow on empty container.",
    whyItBreaks: "`nums.size()` returns an unsigned integer `size_t`. If nums is empty, `0 - 1` wraps around to `18446744073709551615` (SIZE_MAX)! The loop executes 18 quintillion times, immediately crashing on `nums[0]`.",
    fixedCode: `for (int i = 0; i < (int)nums.size(); i++) { // FIXED: Cast or use < nums.size()
    cout << nums[i];
}`
  },
  {
    id: "bug_6",
    title: "Fast & Slow Pointers Null Pointer Exception",
    category: "Linked Lists",
    language: "Java / C++",
    buggyCode: `ListNode slow = head, fast = head;
while (fast.next != null) { // BUG: fast itself can be null
    slow = slow.next;
    fast = fast.next.next;
}`,
    bugDescription: "Null pointer dereference when fast reaches null.",
    whyItBreaks: "If head is null, or if fast advances to null at the end of an even-length list, evaluating `fast.next` dereferences null, throwing NullPointerException or Segmentation Fault.",
    fixedCode: `while (fast != null && fast.next != null) { // FIXED: Guard fast != null first
    slow = slow.next;
    fast = fast.next.next;
}`
  },
  {
    id: "bug_7",
    title: "0/1 Knapsack Forward Loop Corruption",
    category: "Dynamic Programming",
    language: "All",
    buggyCode: `for (int i = 0; i < n; i++) {
    for (int w = weight[i]; w <= W; w++) { // BUG: Forward loop in 0/1 knapsack!
        dp[w] = max(dp[w], dp[w - weight[i]] + val[i]);
    }
}`,
    bugDescription: "Forward loop allows picking the same item multiple times.",
    whyItBreaks: "Because dp[w - weight[i]] was already updated in the CURRENT iteration with item i, subsequent w values can pick item i again, turning a 0/1 knapsack into an unbounded knapsack.",
    fixedCode: `for (int i = 0; i < n; i++) {
    for (int w = W; w >= weight[i]; w--) { // FIXED: Reverse loop preserves previous round state
        dp[w] = max(dp[w], dp[w - weight[i]] + val[i]);
    }
}`
  },
  {
    id: "bug_8",
    title: "Sliding Window Right Pointer Premature Shrink",
    category: "Sliding Window",
    language: "Python",
    buggyCode: `left = 0
for right in range(len(nums)):
    window_sum += nums[right]
    if window_sum >= target: # BUG: Using 'if' instead of 'while'
        min_len = min(min_len, right - left + 1)
        window_sum -= nums[left]
        left += 1`,
    bugDescription: "Fails to shrink window as much as possible.",
    whyItBreaks: "Using `if` only shrinks the window once per iteration. The window could remain valid even after removing multiple elements from the left. An optimal smaller window is missed.",
    fixedCode: `left = 0
for right in range(len(nums)):
    window_sum += nums[right]
    while window_sum >= target: # FIXED: 'while' loop to contract to minimum valid size
        min_len = min(min_len, right - left + 1)
        window_sum -= nums[left]
        left += 1`
  },
  {
    id: "bug_9",
    title: "BST Validation Local Ancestor Trap",
    category: "Trees",
    language: "Java",
    buggyCode: `boolean isValidBST(TreeNode root) {
    if (root == null) return true;
    if (root.left != null && root.left.val >= root.val) return false;
    if (root.right != null && root.right.val <= root.val) return false;
    return isValidBST(root.left) && isValidBST(root.right);
}`,
    bugDescription: "Only validates immediate parent-child relationship, ignoring higher ancestor constraints.",
    whyItBreaks: "A node in the right subtree could be smaller than the root ancestor (e.g. root = 10, root.right = 15, root.right.left = 6). Locally 6 < 15 is valid, but 6 is in root 10's right subtree, violating BST invariant.",
    fixedCode: `boolean isValidBST(TreeNode root) {
    return validate(root, null, null);
}
boolean validate(TreeNode node, Integer min, Integer max) {
    if (node == null) return true;
    if ((min != null && node.val <= min) || (max != null && node.val >= max)) return false;
    return validate(node.left, min, node.val) && validate(node.right, node.val, max);
}`
  },
  {
    id: "bug_10",
    title: "Java Double-Checked Locking Missing Volatile",
    category: "Concurrency",
    language: "Java",
    buggyCode: `class Singleton {
    private static Singleton instance; // BUG: Missing volatile
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) instance = new Singleton();
            }
        }
        return instance;
    }
}`,
    bugDescription: "Instruction reordering exposes partially constructed object.",
    whyItBreaks: "`new Singleton()` consists of allocating memory, running the constructor, and assigning pointer. Without `volatile`, the JVM/CPU can assign pointer before constructor finishes. Another thread seeing `instance != null` reads an uninitialized object.",
    fixedCode: `class Singleton {
    private static volatile Singleton instance; // FIXED: volatile prevents instruction reordering
    // rest of implementation...
}`
  }
];

const outDir = path.resolve("./data/practice");
fs.writeFileSync(path.join(outDir, "spot_the_bug.json"), JSON.stringify(spotTheBugChallenges, null, 2));
console.log(`Generated ${spotTheBugChallenges.length} Spot-the-Bug interview challenges into data/practice/spot_the_bug.json`);


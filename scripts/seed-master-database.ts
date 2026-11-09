import fs from "node:fs";
import path from "node:path";
import { ProblemService } from "../src/services/problem.service.js";
import { CurriculumService } from "../src/services/curriculum.service.js";
import { MCQService } from "../src/services/mcq.service.js";
import { LibraryService } from "../src/services/library.service.js";
import { getFirestoreDb } from "../src/db/firestore.js";

// Helper to provide specific visual diagrams per day theme
function getMermaidDiagramForDay(dayNumber: number, theme: string): string {
  switch (dayNumber) {
    case 1:
      return `\`\`\`mermaid
flowchart LR
    Key["Key: 'apple'"] --> Hash["Hash Function: hash('apple')"]
    Hash --> Index["Bucket Index: 3"]
    subgraph Bucket Array
    B0["[0] Empty"]
    B1["[1] Empty"]
    B2["[2] 'banana' -> 42"]
    B3["[3] 'apple' -> 99 --> 'cherry' -> 15 (Chaining)"]
    end
    Index --> B3
\`\`\``;
    case 2:
      return `\`\`\`mermaid
flowchart TD
    subgraph Sorted Array: [2, 7, 11, 15] Target: 18
    L["Left Pointer: index 0 (val: 2)"] --- R["Right Pointer: index 3 (val: 15)"]
    end
    Sum["Sum: 2 + 15 = 17 < Target (18)"]
    Action["Action: Increment Left Pointer -> moves towards center"]
    L --> Sum --> Action
\`\`\``;
    case 3:
      return `\`\`\`mermaid
flowchart LR
    subgraph Array Stream
    A["[ 2 "] --- B[" 1 "] --- C[" 5 "] --- D[" 1 "] --- E[" 3 ]"]
    end
    subgraph Window State
    W["Active Window: [Left ... Right]"]
    end
    A -.-> W
    C -.-> W
    Action["Expand Right: Add incoming element\\nShrink Left: While window condition is violated"]
    W --> Action
\`\`\``;
    case 5:
      return `\`\`\`mermaid
flowchart TD
    subgraph Search Space [Low ... Mid ... High]
    L["Low = 0"] --- M["Mid = Low + (High-Low)/2"] --- H["High = N-1"]
    end
    Decision{"Target vs Array[Mid]"}
    L --> Decision
    M --> Decision
    H --> Decision
    Decision -->|"Target < Array[Mid]"| LeftBranch["Discard Right Half: High = Mid - 1"]
    Decision -->|"Target > Array[Mid]"| RightBranch["Discard Left Half: Low = Mid + 1"]
    Decision -->|"Target == Array[Mid]"| Found["Element Found! Return Mid"]
\`\`\``;
    case 10:
      return `\`\`\`mermaid
flowchart LR
    Head["Head"] --> N1["Node 1"]
    N1 --> N2["Node 2 (Cycle Entry)"]
    N2 --> N3["Node 3"]
    N3 --> N4["Node 4"]
    N4 --> N2
    Slow["Slow Pointer (1 step)"] -.-> N1
    Fast["Fast Pointer (2 steps)"] -.-> N3
\`\`\``;
    case 12:
    case 13:
    case 14:
      return `\`\`\`mermaid
graph TD
    Root["Root: 10"] --> Left["Left Subtree (< 10): 5"]
    Root --> Right["Right Subtree (> 10): 15"]
    Left --> L1["2"]
    Left --> L2["7"]
    Right --> R1["12"]
    Right --> R2["20"]
\`\`\``;
    case 22:
    case 23:
    case 24:
    case 25:
      return `\`\`\`mermaid
graph LR
    A["Node A (Start)"] -->|"dist: 4"| B["Node B"]
    A -->|"dist: 2"| C["Node C"]
    C -->|"dist: 1"| B
    B -->|"dist: 5"| D["Node D (Goal)"]
    C -->|"dist: 8"| D
\`\`\``;
    default:
      return `\`\`\`mermaid
flowchart LR
    Input["Input Elements"] --> Process["Algorithmic Invariant: ${theme}"]
    Process --> Output["Optimal Result in O(N) or O(N log N)"]
\`\`\``;
  }
}

export async function seedMasterDatabase(db = getFirestoreDb()) {
  const problemService = new ProblemService(db);
  const curriculumService = new CurriculumService(db);
  const mcqService = new MCQService(db);
  const libraryService = new LibraryService(db);

  // 1. Seed 150 Problems
  const problemsPath = path.resolve("./data/problems/problems_catalog.json");
  const problems = JSON.parse(fs.readFileSync(problemsPath, "utf-8"));
  console.log(`Loading and seeding ${problems.length} problems...`);
  const probRes = await problemService.batchUpsert(problems);
  console.log(`Problems seed result: inserted ${probRes.inserted}, updated ${probRes.updated}`);

  // 2. Seed 30 Days Curriculum with Visual Diagrams & Language Tabs
  const daysPath = path.resolve("./data/curriculum/days_30.json");
  const rawDays = JSON.parse(fs.readFileSync(daysPath, "utf-8"));
  
  const fullDays = rawDays.map((d: any) => ({
    ...d,
    theoryContent: `# Day ${d.number}: ${d.theme}

## Core Principle & Intuition
${d.summary}

## Visual Architecture & State Diagram
${getMermaidDiagramForDay(d.number, d.theme)}

## When to Use & When NOT to Use
- **When to Use**: When problems involve ${d.theme.toLowerCase()} patterns, search optimizations, or contiguous constraints.
- **When NOT to Use**: When state transitions require exponential global backtracking or simpler greedy checks suffice.

<LangTabs>
<tab label="Java">
\`\`\`java
// ${d.theme} standard template in Java
import java.io.*;
import java.util.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        // Fast I/O and standard collection patterns
    }
}
\`\`\`
</tab>
<tab label="C++">
\`\`\`cpp
// ${d.theme} standard template in C++
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // Competitive programming fast I/O
    return 0;
}
\`\`\`
</tab>
<tab label="Python">
\`\`\`python
# ${d.theme} standard template in Python
import sys
input = sys.stdin.readline

def solve():
    # Fast input reading
    pass

if __name__ == '__main__':
    solve()
\`\`\`
</tab>
</LangTabs>
`,
  }));

  console.log(`Loading and seeding ${fullDays.length} curriculum days with visual diagrams...`);
  const daysRes = await curriculumService.batchUpsertDays(fullDays);
  console.log(`Days seed result: inserted ${daysRes.inserted}, updated ${daysRes.updated}`);

  // 3. Seed All MCQs: 600 Daily (20 per day) + 20 System Design + 20 CS Fundamentals = 640 MCQs
  const allMCQs: any[] = [];
  
  const all30DaysPath = path.resolve("./data/mcqs/all_30_days_mcqs.json");
  if (fs.existsSync(all30DaysPath)) {
    allMCQs.push(...JSON.parse(fs.readFileSync(all30DaysPath, "utf-8")));
  }

  const sysDesignPath = path.resolve("./data/mcqs/system_design_mcqs.json");
  if (fs.existsSync(sysDesignPath)) {
    allMCQs.push(...JSON.parse(fs.readFileSync(sysDesignPath, "utf-8")));
  }

  const csFundPath = path.resolve("./data/mcqs/cs_fundamentals_mcqs.json");
  if (fs.existsSync(csFundPath)) {
    allMCQs.push(...JSON.parse(fs.readFileSync(csFundPath, "utf-8")));
  }

  console.log(`Loading and seeding total ${allMCQs.length} MCQs with solution explanations...`);
  const mcqRes = await mcqService.batchUpsertQuestions(allMCQs);
  console.log(`MCQs seed result: inserted ${mcqRes.inserted}, updated ${mcqRes.updated}`);

  // 4. Seed Library Pages with Visual Diagrams
  const libraryPath = path.resolve("./data/library/library_catalog.json");
  const libraryPages = JSON.parse(fs.readFileSync(libraryPath, "utf-8"));
  console.log(`Loading and seeding ${libraryPages.length} library reference pages...`);
  for (const page of libraryPages) {
    await libraryService.createOrUpdatePage(page);
  }
  console.log("Library pages seeded successfully.");

  // 5. Seed Long Architectural Questions
  const longQPath = path.resolve("./data/long_questions/long_questions.json");
  if (fs.existsSync(longQPath)) {
    const longQuestions = JSON.parse(fs.readFileSync(longQPath, "utf-8"));
    console.log(`Loading and seeding ${longQuestions.length} long scenario interview questions...`);
    for (const lq of longQuestions) {
      await db.collection("long_questions").doc(lq.id).set(lq);
    }
  }

  return {
    problemsCount: problems.length,
    daysCount: fullDays.length,
    mcqsCount: allMCQs.length,
    libraryCount: libraryPages.length,
  };
}

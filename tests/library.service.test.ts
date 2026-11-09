import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { LibraryService } from "../src/services/library.service.js";

describe("Component 9: Library & CS Fundamentals Content Service", () => {
  let mockDb: MockFirestore;
  let libraryService: LibraryService;

  beforeEach(() => {
    mockDb = new MockFirestore();
    libraryService = new LibraryService(mockDb as any);
  });

  const sampleOsPage = {
    slug: "os/deadlocks",
    section: "os" as const,
    title: "Deadlocks: Conditions & Prevention",
    orderIndex: 1,
    tags: ["OS", "Concurrency", "Synchronization"],
    readTimeMinutes: 8,
    content: "# Deadlocks\nFour Coffman conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.",
    interviewQuestions: [
      {
        q: "What are the four necessary conditions for deadlock?",
        a: "Mutual exclusion, Hold and wait, No preemption, and Circular wait.",
      },
    ],
  };

  it("should create and retrieve a library page by slug", async () => {
    await libraryService.createOrUpdatePage(sampleOsPage);

    const page = await libraryService.getPageBySlug("os/deadlocks");
    expect(page).not.toBeNull();
    expect(page?.title).toBe("Deadlocks: Conditions & Prevention");
    expect(page?.interviewQuestions).toHaveLength(1);
  });

  it("should calculate section progress percentage when pages are read", async () => {
    await libraryService.createOrUpdatePage(sampleOsPage);
    await libraryService.createOrUpdatePage({
      ...sampleOsPage,
      slug: "os/memory-management",
      title: "Memory Management & Paging",
      orderIndex: 2,
    });

    // Mark 1 of 2 pages as read
    await libraryService.markPageAsRead("user_lib_1", "os/deadlocks");

    const progress = await libraryService.getSectionProgress("user_lib_1", "os");
    expect(progress.totalPages).toBe(2);
    expect(progress.readPages).toBe(1);
    expect(progress.percentage).toBe(50);
  });

  it("should search library pages by query across titles, tags, and content", async () => {
    await libraryService.createOrUpdatePage(sampleOsPage);
    await libraryService.createOrUpdatePage({
      slug: "dbms/acid",
      section: "dbms",
      title: "ACID Properties & Transactions",
      orderIndex: 1,
      tags: ["DBMS", "Transactions"],
      readTimeMinutes: 6,
      content: "Atomicity, Consistency, Isolation, Durability.",
      interviewQuestions: [],
    });

    const searchResults = await libraryService.search("Coffman");
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].slug).toBe("os/deadlocks");

    const tagResults = await libraryService.search("Transactions");
    expect(tagResults).toHaveLength(1);
    expect(tagResults[0].slug).toBe("dbms/acid");
  });
});


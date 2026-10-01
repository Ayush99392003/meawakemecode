import { LibraryPage, LibrarySection, LibraryProgress } from "../types/index.js";
import { LibraryPageInputSchema } from "../schemas/library.schema.js";
import { getFirestoreDb } from "../db/firestore.js";

export interface SectionProgressSummary {
  section: LibrarySection;
  totalPages: number;
  readPages: number;
  percentage: number;
}

export class LibraryService {
  private collectionName = "library_pages";

  constructor(private db: any = getFirestoreDb()) {}

  async createOrUpdatePage(input: unknown): Promise<LibraryPage> {
    const validated = LibraryPageInputSchema.parse(input);
    const docId = validated.slug.replace(/\//g, "___");
    const docRef = this.db.collection(this.collectionName).doc(docId);

    await docRef.set(validated, { merge: true });
    return validated;
  }

  async getPageBySlug(slug: string): Promise<LibraryPage | null> {
    const docId = slug.replace(/\//g, "___");
    const doc = await this.db.collection(this.collectionName).doc(docId).get();
    if (!doc.exists) return null;
    return doc.data() as LibraryPage;
  }

  async listPagesBySection(section: LibrarySection): Promise<LibraryPage[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where("section", "==", section)
      .get();

    const pages = snapshot.docs.map((d: any) => d.data() as LibraryPage);
    return pages.sort((a: LibraryPage, b: LibraryPage) => a.orderIndex - b.orderIndex);
  }

  async markPageAsRead(userId: string, slug: string): Promise<LibraryProgress> {
    const docId = slug.replace(/\//g, "___");
    const now = new Date().toISOString();
    const progressRef = this.db
      .collection("users")
      .doc(userId)
      .collection("library_progress")
      .doc(docId);

    const record: LibraryProgress = {
      slug,
      readAt: now,
    };

    await progressRef.set(record);
    return record;
  }

  async getSectionProgress(userId: string, section: LibrarySection): Promise<SectionProgressSummary> {
    const sectionPages = await this.listPagesBySection(section);
    const totalPages = sectionPages.length;

    if (totalPages === 0) {
      return { section, totalPages: 0, readPages: 0, percentage: 0 };
    }

    const readSnap = await this.db
      .collection("users")
      .doc(userId)
      .collection("library_progress")
      .get();

    const readSlugs = new Set(readSnap.docs.map((d: any) => (d.data() as LibraryProgress).slug));
    const readPages = sectionPages.filter((p) => readSlugs.has(p.slug)).length;
    const percentage = Math.round((readPages / totalPages) * 100);

    return { section, totalPages, readPages, percentage };
  }

  async search(query: string): Promise<LibraryPage[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const snapshot = await this.db.collection(this.collectionName).get();
    const pages = snapshot.docs.map((d: any) => d.data() as LibraryPage);

    return pages.filter((page: LibraryPage) => {
      const matchTitle = page.title.toLowerCase().includes(q);
      const matchTags = page.tags.some((t: string) => t.toLowerCase().includes(q));
      const matchContent = page.content.toLowerCase().includes(q);
      return matchTitle || matchTags || matchContent;
    });
  }
}


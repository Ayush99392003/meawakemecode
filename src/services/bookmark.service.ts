import { Bookmark, BookmarkItemType, UserProblemProgress } from "../types/index.js";
import { BookmarkToggleSchema } from "../schemas/progress.schema.js";
import { getFirestoreDb } from "../db/firestore.js";

export class BookmarkService {
  constructor(private db: any = getFirestoreDb()) { }

  async toggleBookmark(input: unknown): Promise<{ bookmarked: boolean; bookmark?: Bookmark }> {
    const validated = BookmarkToggleSchema.parse(input);
    const sanitizedItemId = validated.itemId.replace(/\//g, "___");
    const bookmarkDocId = `${validated.itemType}_${sanitizedItemId}`;

    const bookmarkRef = this.db
      .collection("users")
      .doc(validated.userId)
      .collection("bookmarks")
      .doc(bookmarkDocId);

    const doc = await bookmarkRef.get();
    if (doc.exists) {
      await bookmarkRef.delete();
      return { bookmarked: false };
    }

    const bookmark: Bookmark = {
      id: bookmarkDocId,
      userId: validated.userId,
      itemType: validated.itemType as BookmarkItemType,
      itemId: validated.itemId,
      label: validated.label ?? null,
      createdAt: new Date().toISOString(),
    };

    await bookmarkRef.set(bookmark);
    return { bookmarked: true, bookmark };
  }

  async listBookmarks(userId: string, itemType?: BookmarkItemType): Promise<Bookmark[]> {
    let query: any = this.db.collection("users").doc(userId).collection("bookmarks");

    if (itemType) {
      query = query.where("itemType", "==", itemType);
    }

    const snapshot = await query.get();
    const bookmarks = snapshot.docs.map((d: any) => d.data() as Bookmark);
    return bookmarks.sort(
      (a: Bookmark, b: Bookmark) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Retrieves problems marked as 'revisit', sorted by age for spaced repetition.
   */
  async getSpacedRevisitQueue(
    userId: string,
    olderThanDays: number = 7,
    referenceDate: Date = new Date()
  ): Promise<UserProblemProgress[]> {
    const snapshot = await this.db
      .collection("users")
      .doc(userId)
      .collection("progress")
      .where("status", "==", "revisit")
      .get();

    const cutoffTime = referenceDate.getTime() - olderThanDays * 24 * 60 * 60 * 1000;

    const list = snapshot.docs
      .map((d: any) => d.data() as UserProblemProgress)
      .filter((p: UserProblemProgress) => {
        const updateTime = new Date(p.updatedAt).getTime();
        return updateTime <= cutoffTime;
      });

    return list.sort(
      (a: UserProblemProgress, b: UserProblemProgress) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
  }
}


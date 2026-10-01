/**
 * In-memory Mock Firestore implementation for high-speed, isolated unit and integration testing.
 * Implements the core Firestore CollectionReference, DocumentReference, and Query APIs.
 */

export class MockDocumentReference {
  constructor(public id: string, private dataStore: Map<string, any>, private path: string) {}

  async get(): Promise<{ exists: boolean; id: string; data: () => any }> {
    const data = this.dataStore.get(this.path);
    return {
      exists: data !== undefined,
      id: this.id,
      data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined),
    };
  }

  async set(data: any, options?: { merge?: boolean }): Promise<void> {
    if (options?.merge) {
      const existing = this.dataStore.get(this.path) || {};
      this.dataStore.set(this.path, { ...existing, ...JSON.parse(JSON.stringify(data)) });
    } else {
      this.dataStore.set(this.path, JSON.parse(JSON.stringify(data)));
    }
  }

  async update(updates: any): Promise<void> {
    const existing = this.dataStore.get(this.path);
    if (!existing) {
      throw new Error(`Document does not exist at ${this.path}`);
    }
    this.dataStore.set(this.path, { ...existing, ...JSON.parse(JSON.stringify(updates)) });
  }

  async delete(): Promise<void> {
    this.dataStore.delete(this.path);
  }

  collection(subCollectionName: string): MockCollectionReference {
    return new MockCollectionReference(`${this.path}/${subCollectionName}`, this.dataStore);
  }
}

export class MockQuery {
  constructor(
    protected collectionPath: string,
    protected dataStore: Map<string, any>,
    protected filters: Array<(doc: any) => boolean> = []
  ) {}

  where(field: string, opStr: string, value: any): MockQuery {
    const newFilters = [...this.filters];
    newFilters.push((doc: any) => {
      const docVal = doc[field];
      switch (opStr) {
        case "==":
          return docVal === value;
        case "!=":
          return docVal !== value;
        case ">":
          return docVal > value;
        case ">=":
          return docVal >= value;
        case "<":
          return docVal < value;
        case "<=":
          return docVal <= value;
        case "array-contains":
          return Array.isArray(docVal) && docVal.includes(value);
        case "in":
          return Array.isArray(value) && value.includes(docVal);
        default:
          return true;
      }
    });
    return new MockQuery(this.collectionPath, this.dataStore, newFilters);
  }

  async get(): Promise<{ docs: Array<{ id: string; data: () => any }>; empty: boolean; size: number }> {
    const prefix = `${this.collectionPath}/`;
    const docs: Array<{ id: string; data: () => any }> = [];

    for (const [key, val] of this.dataStore.entries()) {
      if (key.startsWith(prefix)) {
        const subPath = key.slice(prefix.length);
        if (!subPath.includes("/")) {
          // direct child
          let matches = true;
          for (const filter of this.filters) {
            if (!filter(val)) {
              matches = false;
              break;
            }
          }
          if (matches) {
            docs.push({
              id: subPath,
              data: () => JSON.parse(JSON.stringify(val)),
            });
          }
        }
      }
    }

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
    };
  }
}

export class MockCollectionReference extends MockQuery {
  constructor(collectionPath: string, dataStore: Map<string, any>) {
    super(collectionPath, dataStore);
  }

  doc(id?: string): MockDocumentReference {
    const docId = id || Math.random().toString(36).substring(2, 12);
    return new MockDocumentReference(docId, this.dataStore, `${this.collectionPath}/${docId}`);
  }

  async add(data: any): Promise<MockDocumentReference> {
    const docRef = this.doc();
    await docRef.set(data);
    return docRef;
  }
}

export class MockFirestore {
  private dataStore = new Map<string, any>();

  collection(name: string): MockCollectionReference {
    return new MockCollectionReference(name, this.dataStore);
  }

  doc(path: string): MockDocumentReference {
    const parts = path.split("/");
    const id = parts[parts.length - 1];
    return new MockDocumentReference(id, this.dataStore, path);
  }

  clear(): void {
    this.dataStore.clear();
  }
}


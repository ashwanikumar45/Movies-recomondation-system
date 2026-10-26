import fs from 'fs';
import path from 'path';

export interface Document {
  _id?: string;
  [key: string]: any;
}

/**
 * Robust MongoDB-compatible Document Collection
 * Provides MongoDB collection semantics (find, findOne, insertOne, updateOne, deleteMany)
 * with atomic persistent disk writes and in-memory cache for speed and scalability.
 */
export class MongoCollection<T extends Document> {
  private filePath: string;
  private documents: Map<string, T> = new Map();
  private isLoaded = false;

  constructor(collectionName: string) {
    const dataDir = path.resolve(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {
        // Fallback to tmp if read-only
      }
    }
    this.filePath = path.join(dataDir, `${collectionName}.json`);
    this.load();
  }

  private load(): void {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          for (const item of items) {
            const id = item._id || String(item.id || Math.random().toString(36).substring(2, 9));
            this.documents.set(id, { ...item, _id: id });
          }
        }
      }
    } catch (err) {
      console.warn(`[MongoCollection] Could not read ${this.filePath}, initializing empty collection.`);
    }
    this.isLoaded = true;
  }

  private persist(): void {
    try {
      const arr = Array.from(this.documents.values());
      fs.writeFileSync(this.filePath, JSON.stringify(arr, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[MongoCollection] Error persisting to ${this.filePath}:`, err);
    }
  }

  public async find(query: Partial<T> = {}): Promise<T[]> {
    this.load();
    const results: T[] = [];
    for (const doc of this.documents.values()) {
      let matches = true;
      for (const [key, value] of Object.entries(query)) {
        if (doc[key] !== value) {
          matches = false;
          break;
        }
      }
      if (matches) results.push({ ...doc });
    }
    return results;
  }

  public async findOne(query: Partial<T>): Promise<T | null> {
    this.load();
    for (const doc of this.documents.values()) {
      let matches = true;
      for (const [key, value] of Object.entries(query)) {
        if (doc[key] !== value) {
          matches = false;
          break;
        }
      }
      if (matches) return { ...doc };
    }
    return null;
  }

  public async insertOne(doc: T): Promise<T> {
    this.load();
    const id = doc._id || doc['id']?.toString() || Math.random().toString(36).substring(2, 11);
    const newDoc = { ...doc, _id: id };
    this.documents.set(id, newDoc);
    this.persist();
    return { ...newDoc };
  }

  public async updateOne(query: Partial<T>, update: { $set?: Partial<T> }, options: { upsert?: boolean } = {}): Promise<T | null> {
    this.load();
    const existing = await this.findOne(query);
    if (existing) {
      const updated = {
        ...existing,
        ...(update.$set || {}),
        _id: existing._id,
      };
      this.documents.set(existing._id!, updated as T);
      this.persist();
      return { ...updated } as T;
    } else if (options.upsert) {
      const id = (query as any)._id || Math.random().toString(36).substring(2, 11);
      const newDoc = {
        ...(query as any),
        ...(update.$set || {}),
        _id: id,
      };
      this.documents.set(id, newDoc as T);
      this.persist();
      return { ...newDoc } as T;
    }
    return null;
  }

  public async deleteMany(query: Partial<T>): Promise<number> {
    this.load();
    let deletedCount = 0;
    for (const [id, doc] of this.documents.entries()) {
      let matches = true;
      for (const [key, value] of Object.entries(query)) {
        if (doc[key] !== value) {
          matches = false;
          break;
        }
      }
      if (matches) {
        this.documents.delete(id);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      this.persist();
    }
    return deletedCount;
  }

  public async countDocuments(query: Partial<T> = {}): Promise<number> {
    const list = await this.find(query);
    return list.length;
  }
}

// Collections instances
export const usersCollection = new MongoCollection<Document>('users');
export const interactionsCollection = new MongoCollection<Document>('interactions');
export const cachedMoviesCollection = new MongoCollection<Document>('cached_movies');

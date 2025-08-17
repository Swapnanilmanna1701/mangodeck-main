import { users, summaries, emailLogs, type User, type InsertUser, type Summary, type InsertSummary, type EmailLog, type InsertEmailLog } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTheme(id: string, theme: string): Promise<void>;
  
  // Summary methods
  createSummary(summary: InsertSummary & { userId: string }): Promise<Summary>;
  updateSummary(id: string, updates: Partial<InsertSummary>): Promise<Summary>;
  getSummary(id: string): Promise<Summary | undefined>;
  getUserSummaries(userId: string): Promise<Summary[]>;
  deleteSummary(id: string): Promise<void>;
  
  // Email log methods
  createEmailLog(emailLog: InsertEmailLog): Promise<EmailLog>;
  getSummaryEmailLogs(summaryId: string): Promise<EmailLog[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserTheme(id: string, theme: string): Promise<void> {
    await db
      .update(users)
      .set({ theme })
      .where(eq(users.id, id));
  }

  async createSummary(summary: InsertSummary & { userId: string }): Promise<Summary> {
    const [newSummary] = await db
      .insert(summaries)
      .values(summary)
      .returning();
    return newSummary;
  }

  async updateSummary(id: string, updates: Partial<InsertSummary>): Promise<Summary> {
    const [updatedSummary] = await db
      .update(summaries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(summaries.id, id))
      .returning();
    return updatedSummary;
  }

  async getSummary(id: string): Promise<Summary | undefined> {
    const [summary] = await db.select().from(summaries).where(eq(summaries.id, id));
    return summary || undefined;
  }

  async getUserSummaries(userId: string): Promise<Summary[]> {
    return await db
      .select()
      .from(summaries)
      .where(eq(summaries.userId, userId))
      .orderBy(desc(summaries.updatedAt));
  }

  async deleteSummary(id: string): Promise<void> {
    await db.delete(summaries).where(eq(summaries.id, id));
  }

  async createEmailLog(emailLog: InsertEmailLog): Promise<EmailLog> {
    const [newEmailLog] = await db
      .insert(emailLogs)
      .values(emailLog)
      .returning();
    return newEmailLog;
  }

  async getSummaryEmailLogs(summaryId: string): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.summaryId, summaryId))
      .orderBy(desc(emailLogs.sentAt));
  }
}

export const storage = new DatabaseStorage();

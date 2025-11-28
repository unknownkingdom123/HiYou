import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, ilike } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { 
  User, InsertUser, Pdf, InsertPdf, ExternalLink, InsertExternalLink,
  DownloadHistory, InsertDownloadHistory, Otp, InsertOtp, Session, InsertSession,
  DownloadWithPdf
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export class DatabaseStorage {
  private db: ReturnType<typeof drizzle> | null = null;

  constructor(db: ReturnType<typeof drizzle> | null = null) {
    this.db = db;
  }

  // Helper to check if DB is available
  private isDbAvailable(): boolean {
    return this.db !== null;
  }

  // ============= USERS =============
  async getUser(id: string): Promise<User | undefined> {
    if (!this.isDbAvailable()) return undefined;
    
    try {
      const result = await this.db!.select()
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("DB Error - getUser:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.isDbAvailable()) return undefined;
    
    try {
      const result = await this.db!.select()
        .from(schema.users)
        .where(eq(schema.users.username, username))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("DB Error - getUserByUsername:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!this.isDbAvailable()) return undefined;
    
    try {
      const result = await this.db!.select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("DB Error - getUserByEmail:", error);
      return undefined;
    }
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    if (!this.isDbAvailable()) return undefined;
    
    try {
      const result = await this.db!.select()
        .from(schema.users)
        .where(eq(schema.users.mobile, mobile))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("DB Error - getUserByMobile:", error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    if (!this.isDbAvailable()) throw new Error("Database not available");
    
    try {
      const id = randomUUID();
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await this.db!.insert(schema.users).values({
        id,
        email: user.email,
        username: user.username,
        mobile: user.mobile,
        password: hashedPassword,
        isVerified: true,
        isAdmin: false,
        totalDownloads: 0,
      });

      const result = await this.getUser(id);
      if (!result) throw new Error("Failed to create user");
      return result;
    } catch (error) {
      console.error("DB Error - createUser:", error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    if (!this.isDbAvailable()) return undefined;
    
    try {
      await this.db!.update(schema.users)
        .set(updates)
        .where(eq(schema.users.id, id));
      
      return this.getUser(id);
    } catch (error) {
      console.error("DB Error - updateUser:", error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.isDbAvailable()) return [];
    
    try {
      return await this.db!.select().from(schema.users);
    } catch (error) {
      console.error("DB Error - getAllUsers:", error);
      return [];
    }
  }

  async incrementUserDownloads(id: string): Promise<void> {
    if (!this.isDbAvailable()) return;
    
    try {
      const user = await this.getUser(id);
      if (user) {
        await this.updateUser(id, {
          totalDownloads: (user.totalDownloads || 0) + 1,
        });
      }
    } catch (error) {
      console.error("DB Error - incrementUserDownloads:", error);
    }
  }

  // ============= PDFs =============
  async getPdf(id: string): Promise<Pdf | undefined> {
    if (!this.isDbAvailable()) return undefined;
    
    try {
      const result = await this.db!.select()
        .from(schema.pdfs)
        .where(eq(schema.pdfs.id, id))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("DB Error - getPdf:", error);
      return undefined;
    }
  }

  async createPdf(insertPdf: InsertPdf): Promise<Pdf> {
    if (!this.isDbAvailable()) throw new Error("Database not available");
    
    try {
      const id = randomUUID();
      
      await this.db!.insert(schema.pdfs).values({
        id,
        title: insertPdf.title,
        author: insertPdf.author || null,
        category: insertPdf.category || null,
        description: insertPdf.description || null,
        tags: insertPdf.tags || null,
        filename: insertPdf.filename,
        fileSize: insertPdf.fileSize || null,
      });

      const result = await this.getPdf(id);
      if (!result) throw new Error("Failed to create PDF");
      return result;
    } catch (error) {
      console.error("DB Error - createPdf:", error);
      throw error;
    }
  }

  async updatePdf(id: string, updates: Partial<Pdf>): Promise<Pdf | undefined> {
    if (!this.isDbAvailable()) return undefined;
    
    try {
      await this.db!.update(schema.pdfs)
        .set(updates)
        .where(eq(schema.pdfs.id, id));
      
      return this.getPdf(id);
    } catch (error) {
      console.error("DB Error - updatePdf:", error);
      return undefined;
    }
  }

  async deletePdf(id: string): Promise<void> {
    if (!this.isDbAvailable()) return;
    
    try {
      await this.db!.delete(schema.pdfs)
        .where(eq(schema.pdfs.id, id));
    } catch (error) {
      console.error("DB Error - deletePdf:", error);
    }
  }

  async getAllPdfs(): Promise<Pdf[]> {
    if (!this.isDbAvailable()) return [];
    
    try {
      return await this.db!.select().from(schema.pdfs);
    } catch (error) {
      console.error("DB Error - getAllPdfs:", error);
      return [];
    }
  }

  // ============= EXTERNAL LINKS =============
  async getExternalLink(id: string): Promise<ExternalLink | undefined> {
    if (!this.isDbAvailable()) return undefined;
    
    try {
      const result = await this.db!.select()
        .from(schema.externalLinks)
        .where(eq(schema.externalLinks.id, id))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("DB Error - getExternalLink:", error);
      return undefined;
    }
  }

  async createExternalLink(link: InsertExternalLink): Promise<ExternalLink> {
    if (!this.isDbAvailable()) throw new Error("Database not available");
    
    try {
      const id = randomUUID();
      
      await this.db!.insert(schema.externalLinks).values({
        id,
        title: link.title,
        url: link.url,
        description: link.description || null,
      });

      const result = await this.getExternalLink(id);
      if (!result) throw new Error("Failed to create external link");
      return result;
    } catch (error) {
      console.error("DB Error - createExternalLink:", error);
      throw error;
    }
  }

  async deleteExternalLink(id: string): Promise<void> {
    if (!this.isDbAvailable()) return;
    
    try {
      await this.db!.delete(schema.externalLinks)
        .where(eq(schema.externalLinks.id, id));
    } catch (error) {
      console.error("DB Error - deleteExternalLink:", error);
    }
  }

  async getAllExternalLinks(): Promise<ExternalLink[]> {
    if (!this.isDbAvailable()) return [];
    
    try {
      return await this.db!.select().from(schema.externalLinks);
    } catch (error) {
      console.error("DB Error - getAllExternalLinks:", error);
      return [];
    }
  }

  // ============= DOWNLOADS =============
  async createDownloadHistory(download: InsertDownloadHistory): Promise<DownloadHistory> {
    if (!this.isDbAvailable()) throw new Error("Database not available");
    
    try {
      const id = randomUUID();
      
      await this.db!.insert(schema.downloadHistory).values({
        id,
        userId: download.userId,
        pdfId: download.pdfId,
      });

      const result = await this.db!.select()
        .from(schema.downloadHistory)
        .where(eq(schema.downloadHistory.id, id))
        .limit(1);
      
      if (!result[0]) throw new Error("Failed to create download history");
      return result[0];
    } catch (error) {
      console.error("DB Error - createDownloadHistory:", error);
      throw error;
    }
  }

  async getUserDownloads(userId: string): Promise<DownloadWithPdf[]> {
    if (!this.isDbAvailable()) return [];
    
    try {
      const downloads = await this.db!.select()
        .from(schema.downloadHistory)
        .where(eq(schema.downloadHistory.userId, userId));

      const result: DownloadWithPdf[] = [];
      for (const download of downloads) {
        const pdf = await this.getPdf(download.pdfId);
        if (pdf) {
          result.push({ ...download, pdf });
        }
      }
      return result;
    } catch (error) {
      console.error("DB Error - getUserDownloads:", error);
      return [];
    }
  }

  async getAllDownloads(): Promise<DownloadHistory[]> {
    if (!this.isDbAvailable()) return [];
    
    try {
      return await this.db!.select().from(schema.downloadHistory);
    } catch (error) {
      console.error("DB Error - getAllDownloads:", error);
      return [];
    }
  }

  // ============= OTP =============
  async createOtp(otp: InsertOtp): Promise<Otp> {
    if (!this.isDbAvailable()) throw new Error("Database not available");
    
    try {
      const id = randomUUID();
      
      await this.db!.insert(schema.otpCodes).values({
        id,
        userId: otp.userId || null,
        mobile: otp.mobile || null,
        email: otp.email || null,
        code: otp.code,
        type: otp.type,
        expiresAt: otp.expiresAt,
        isUsed: false,
      });

      const result = await this.db!.select()
        .from(schema.otpCodes)
        .where(eq(schema.otpCodes.id, id))
        .limit(1);
      
      if (!result[0]) throw new Error("Failed to create OTP");
      return result[0];
    } catch (error) {
      console.error("DB Error - createOtp:", error);
      throw error;
    }
  }

  async getOtpByMobileAndCode(mobile: string, code: string, type: string): Promise<Otp | undefined> {
    if (!this.isDbAvailable()) return undefined;
    
    try {
      const result = await this.db!.select()
        .from(schema.otpCodes)
        .where(and(
          eq(schema.otpCodes.mobile, mobile),
          eq(schema.otpCodes.code, code),
          eq(schema.otpCodes.type, type)
        ))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("DB Error - getOtpByMobileAndCode:", error);
      return undefined;
    }
  }

  async getOtpByEmailAndCode(email: string, code: string, type: string): Promise<Otp | undefined> {
    if (!this.isDbAvailable()) return undefined;
    
    try {
      const result = await this.db!.select()
        .from(schema.otpCodes)
        .where(and(
          eq(schema.otpCodes.email, email),
          eq(schema.otpCodes.code, code),
          eq(schema.otpCodes.type, type)
        ))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("DB Error - getOtpByEmailAndCode:", error);
      return undefined;
    }
  }

  async markOtpAsUsed(id: string): Promise<void> {
    if (!this.isDbAvailable()) return;
    
    try {
      await this.db!.update(schema.otpCodes)
        .set({ isUsed: true })
        .where(eq(schema.otpCodes.id, id));
    } catch (error) {
      console.error("DB Error - markOtpAsUsed:", error);
    }
  }

  async deleteExpiredOtps(): Promise<void> {
    if (!this.isDbAvailable()) return;
    
    try {
      // This would require timestamp comparison in drizzle
      // For now, we'll skip this in DB storage
    } catch (error) {
      console.error("DB Error - deleteExpiredOtps:", error);
    }
  }

  // ============= SESSIONS =============
  async createSession(session: InsertSession): Promise<Session> {
    if (!this.isDbAvailable()) throw new Error("Database not available");
    
    try {
      const id = randomUUID();
      
      await this.db!.insert(schema.sessions).values({
        id,
        userId: session.userId,
        token: session.token,
        expiresAt: session.expiresAt,
      });

      const result = await this.db!.select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, id))
        .limit(1);
      
      if (!result[0]) throw new Error("Failed to create session");
      return result[0];
    } catch (error) {
      console.error("DB Error - createSession:", error);
      throw error;
    }
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    if (!this.isDbAvailable()) return undefined;
    
    try {
      const result = await this.db!.select()
        .from(schema.sessions)
        .where(eq(schema.sessions.token, token))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("DB Error - getSessionByToken:", error);
      return undefined;
    }
  }

  async deleteSession(token: string): Promise<void> {
    if (!this.isDbAvailable()) return;
    
    try {
      await this.db!.delete(schema.sessions)
        .where(eq(schema.sessions.token, token));
    } catch (error) {
      console.error("DB Error - deleteSession:", error);
    }
  }
}

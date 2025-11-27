import { 
  type User, type InsertUser,
  type Pdf, type InsertPdf,
  type ExternalLink, type InsertExternalLink,
  type DownloadHistory, type InsertDownloadHistory,
  type Otp, type InsertOtp,
  type Session, type InsertSession,
  type DownloadWithPdf
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  incrementUserDownloads(id: string): Promise<void>;

  // OTP
  createOtp(otp: InsertOtp): Promise<Otp>;
  getOtpByMobileAndCode(mobile: string, code: string, type: string): Promise<Otp | undefined>;
  getOtpByEmailAndCode(email: string, code: string, type: string): Promise<Otp | undefined>;
  markOtpAsUsed(id: string): Promise<void>;
  deleteExpiredOtps(): Promise<void>;

  // Sessions
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;

  // PDFs
  getPdf(id: string): Promise<Pdf | undefined>;
  getAllPdfs(): Promise<Pdf[]>;
  createPdf(pdf: InsertPdf): Promise<Pdf>;
  updatePdf(id: string, updates: Partial<Pdf>): Promise<Pdf | undefined>;
  deletePdf(id: string): Promise<void>;
  searchPdfs(query: string): Promise<Pdf[]>;

  // External Links
  getExternalLink(id: string): Promise<ExternalLink | undefined>;
  getAllExternalLinks(): Promise<ExternalLink[]>;
  createExternalLink(link: InsertExternalLink): Promise<ExternalLink>;
  updateExternalLink(id: string, updates: Partial<ExternalLink>): Promise<ExternalLink | undefined>;
  deleteExternalLink(id: string): Promise<void>;
  searchExternalLinks(query: string): Promise<ExternalLink | undefined>;

  // Download History
  createDownloadHistory(download: InsertDownloadHistory): Promise<DownloadHistory>;
  getUserDownloads(userId: string): Promise<DownloadWithPdf[]>;
  getAllDownloads(): Promise<DownloadHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private otps: Map<string, Otp>;
  private sessions: Map<string, Session>;
  private pdfs: Map<string, Pdf>;
  private externalLinks: Map<string, ExternalLink>;
  private downloadHistory: Map<string, DownloadHistory>;

  constructor() {
    this.users = new Map();
    this.otps = new Map();
    this.sessions = new Map();
    this.pdfs = new Map();
    this.externalLinks = new Map();
    this.downloadHistory = new Map();

    // Create default admin user
    this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin: User = {
      id: randomUUID(),
      email: "admin@clgbooks.com",
      username: "admin",
      mobile: "+911234567890",
      password: hashedPassword,
      isVerified: true,
      isAdmin: true,
      totalDownloads: 0,
    };
    this.users.set(admin.id, admin);

    // Add some sample PDFs for testing
    const samplePdfs: Omit<Pdf, "id" | "uploadedAt">[] = [
      {
        title: "Engineering Physics",
        author: "H.K. Malik",
        category: "Physics",
        description: "Comprehensive engineering physics textbook",
        tags: ["physics", "engineering", "mechanics"],
        filename: "engineering_physics.pdf",
        fileSize: 5242880,
      },
      {
        title: "C Programming Language",
        author: "Dennis Ritchie",
        category: "Programming",
        description: "The classic C programming book",
        tags: ["c", "programming", "computer science"],
        filename: "c_programming.pdf",
        fileSize: 3145728,
      },
      {
        title: "Data Structures and Algorithms",
        author: "Cormen",
        category: "Computer Science",
        description: "Introduction to algorithms",
        tags: ["algorithms", "data structures", "programming"],
        filename: "dsa.pdf",
        fileSize: 8388608,
      },
      {
        title: "Engineering Mathematics",
        author: "B.S. Grewal",
        category: "Mathematics",
        description: "Higher engineering mathematics",
        tags: ["mathematics", "calculus", "engineering"],
        filename: "engineering_math.pdf",
        fileSize: 6291456,
      },
      {
        title: "Digital Electronics",
        author: "Morris Mano",
        category: "Electronics",
        description: "Digital design fundamentals",
        tags: ["electronics", "digital", "logic gates"],
        filename: "digital_electronics.pdf",
        fileSize: 4194304,
      },
    ];

    for (const pdf of samplePdfs) {
      const id = randomUUID();
      this.pdfs.set(id, {
        id,
        ...pdf,
        uploadedAt: new Date(),
      });
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.mobile === mobile
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      isVerified: insertUser.isVerified ?? false,
      isAdmin: insertUser.isAdmin ?? false,
      totalDownloads: 0,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => !u.isAdmin);
  }

  async incrementUserDownloads(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.totalDownloads = (user.totalDownloads || 0) + 1;
      this.users.set(id, user);
    }
  }

  // OTP
  async createOtp(insertOtp: InsertOtp): Promise<Otp> {
    const id = randomUUID();
    const otp: Otp = { 
      ...insertOtp, 
      id,
      isUsed: false,
    };
    this.otps.set(id, otp);
    return otp;
  }

  async getOtpByMobileAndCode(mobile: string, code: string, type: string): Promise<Otp | undefined> {
    return Array.from(this.otps.values()).find(
      (otp) => 
        otp.mobile === mobile && 
        otp.code === code && 
        otp.type === type && 
        !otp.isUsed &&
        new Date(otp.expiresAt) > new Date()
    );
  }

  async getOtpByEmailAndCode(email: string, code: string, type: string): Promise<Otp | undefined> {
    return Array.from(this.otps.values()).find(
      (otp) => 
        otp.email === email && 
        otp.code === code && 
        otp.type === type && 
        !otp.isUsed &&
        new Date(otp.expiresAt) > new Date()
    );
  }

  async markOtpAsUsed(id: string): Promise<void> {
    const otp = this.otps.get(id);
    if (otp) {
      otp.isUsed = true;
      this.otps.set(id, otp);
    }
  }

  async deleteExpiredOtps(): Promise<void> {
    const now = new Date();
    for (const [id, otp] of this.otps) {
      if (new Date(otp.expiresAt) < now) {
        this.otps.delete(id);
      }
    }
  }

  // Sessions
  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = { ...insertSession, id };
    this.sessions.set(insertSession.token, session);
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const session = this.sessions.get(token);
    if (session && new Date(session.expiresAt) > new Date()) {
      return session;
    }
    return undefined;
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    for (const [token, session] of this.sessions) {
      if (session.userId === userId) {
        this.sessions.delete(token);
      }
    }
  }

  // PDFs
  async getPdf(id: string): Promise<Pdf | undefined> {
    return this.pdfs.get(id);
  }

  async getAllPdfs(): Promise<Pdf[]> {
    return Array.from(this.pdfs.values());
  }

  async createPdf(insertPdf: InsertPdf): Promise<Pdf> {
    const id = randomUUID();
    const pdf: Pdf = {
      ...insertPdf,
      id,
      uploadedAt: new Date(),
    };
    this.pdfs.set(id, pdf);
    return pdf;
  }

  async updatePdf(id: string, updates: Partial<Pdf>): Promise<Pdf | undefined> {
    const pdf = this.pdfs.get(id);
    if (!pdf) return undefined;
    const updated = { ...pdf, ...updates };
    this.pdfs.set(id, updated);
    return updated;
  }

  async deletePdf(id: string): Promise<void> {
    this.pdfs.delete(id);
  }

  async searchPdfs(query: string): Promise<Pdf[]> {
    // Simple search implementation - will be enhanced with Fuse.js in routes
    return Array.from(this.pdfs.values());
  }

  // External Links
  async getExternalLink(id: string): Promise<ExternalLink | undefined> {
    return this.externalLinks.get(id);
  }

  async getAllExternalLinks(): Promise<ExternalLink[]> {
    return Array.from(this.externalLinks.values());
  }

  async createExternalLink(insertLink: InsertExternalLink): Promise<ExternalLink> {
    const id = randomUUID();
    const link: ExternalLink = { ...insertLink, id };
    this.externalLinks.set(id, link);
    return link;
  }

  async updateExternalLink(id: string, updates: Partial<ExternalLink>): Promise<ExternalLink | undefined> {
    const link = this.externalLinks.get(id);
    if (!link) return undefined;
    const updated = { ...link, ...updates };
    this.externalLinks.set(id, updated);
    return updated;
  }

  async deleteExternalLink(id: string): Promise<void> {
    this.externalLinks.delete(id);
  }

  async searchExternalLinks(query: string): Promise<ExternalLink | undefined> {
    // Simple search - will be enhanced with Fuse.js
    const lowerQuery = query.toLowerCase();
    return Array.from(this.externalLinks.values()).find(
      (link) => link.title.toLowerCase().includes(lowerQuery)
    );
  }

  // Download History
  async createDownloadHistory(insertDownload: InsertDownloadHistory): Promise<DownloadHistory> {
    const id = randomUUID();
    const download: DownloadHistory = {
      ...insertDownload,
      id,
      downloadedAt: new Date(),
    };
    this.downloadHistory.set(id, download);
    return download;
  }

  async getUserDownloads(userId: string): Promise<DownloadWithPdf[]> {
    const downloads = Array.from(this.downloadHistory.values())
      .filter((d) => d.userId === userId)
      .sort((a, b) => new Date(b.downloadedAt!).getTime() - new Date(a.downloadedAt!).getTime());
    
    const result: DownloadWithPdf[] = [];
    for (const download of downloads) {
      const pdf = await this.getPdf(download.pdfId);
      if (pdf) {
        result.push({ ...download, pdf });
      }
    }
    return result;
  }

  async getAllDownloads(): Promise<DownloadHistory[]> {
    return Array.from(this.downloadHistory.values());
  }
}

export const storage = new MemStorage();

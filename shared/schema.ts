import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - stores user information
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(), // MIS NO.
  mobile: text("mobile").notNull(),
  password: text("password").notNull(),
  isVerified: boolean("is_verified").default(false),
  isAdmin: boolean("is_admin").default(false),
  totalDownloads: integer("total_downloads").default(0),
});

// OTP verification table
export const otpCodes = pgTable("otp_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  mobile: text("mobile"),
  email: text("email"),
  code: text("code").notNull(),
  type: text("type").notNull(), // 'signup', 'forgot_password'
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
});

// PDFs table - stores uploaded PDF metadata
export const pdfs = pgTable("pdfs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  author: text("author"),
  category: text("category"),
  description: text("description"),
  tags: text("tags").array(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").default(sql`now()`),
});

// External links table
export const externalLinks = pgTable("external_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
});

// Download history table
export const downloadHistory = pgTable("download_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  pdfId: varchar("pdf_id").notNull(),
  downloadedAt: timestamp("downloaded_at").default(sql`now()`),
});

// Sessions table for remember me functionality
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, totalDownloads: true });
export const insertPdfSchema = createInsertSchema(pdfs).omit({ id: true, uploadedAt: true });
export const insertExternalLinkSchema = createInsertSchema(externalLinks).omit({ id: true });
export const insertDownloadHistorySchema = createInsertSchema(downloadHistory).omit({ id: true, downloadedAt: true });
export const insertOtpSchema = createInsertSchema(otpCodes).omit({ id: true, isUsed: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true });

// Signup schema with validation
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "MIS NO. must be at least 3 characters"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "MIS NO. is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email or Mobile is required"),
  method: z.enum(["email", "mobile"]),
});

// Reset password schema
export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// OTP verification schema
export const otpVerifySchema = z.object({
  code: z.string().length(6, "OTP must be 6 digits"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPdf = z.infer<typeof insertPdfSchema>;
export type Pdf = typeof pdfs.$inferSelect;
export type InsertExternalLink = z.infer<typeof insertExternalLinkSchema>;
export type ExternalLink = typeof externalLinks.$inferSelect;
export type InsertDownloadHistory = z.infer<typeof insertDownloadHistorySchema>;
export type DownloadHistory = typeof downloadHistory.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type Otp = typeof otpCodes.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Chat message types
export type ChatMessage = {
  id: string;
  role: "user" | "bot";
  content: string;
  pdfResults?: Pdf[];
  externalLink?: ExternalLink;
};

// Download with PDF info
export type DownloadWithPdf = DownloadHistory & {
  pdf: Pdf;
};

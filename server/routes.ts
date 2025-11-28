import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import Fuse from "fuse.js";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "clgbooks-secret-key";
const JWT_EXPIRES_IN = "7d";
const REMEMBER_ME_EXPIRES_IN = "30d";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Auth middleware
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Admin middleware
async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============= AUTH ROUTES =============

  // Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, mobile, password } = req.body;

      // Validation
      if (!username || !mobile || !password) {
        return res.status(400).json({ message: "Username, mobile, and password are required" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username (MIS NO.) already exists" });
      }

      const existingMobile = await storage.getUserByMobile(mobile);
      if (existingMobile) {
        return res.status(400).json({ message: "Mobile number already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user (verified immediately, no OTP needed)
      const user = await storage.createUser({
        email: null,
        username,
        mobile,
        password: hashedPassword,
        isVerified: true,
        isAdmin: false,
      });

      res.status(201).json({ 
        message: "Account created successfully. Please sign in.",
        user: {
          id: user.id,
          username: user.username,
          mobile: user.mobile,
          isAdmin: user.isAdmin,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Verify OTP (Signup)
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { mobile, email, code, type } = req.body;

      let otp;
      if (mobile) {
        otp = await storage.getOtpByMobileAndCode(mobile, code, type);
      } else if (email) {
        otp = await storage.getOtpByEmailAndCode(email, code, type);
      }

      if (!otp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Mark OTP as used
      await storage.markOtpAsUsed(otp.id);

      // Verify user
      if (otp.userId) {
        await storage.updateUser(otp.userId, { isVerified: true });
      }

      res.json({ message: "Verification successful" });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Resend OTP
  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { mobile, email, type } = req.body;

      let user;
      let identifier = mobile || email;
      
      if (mobile) {
        user = await storage.getUserByMobile(mobile);
      } else if (email) {
        user = await storage.getUserByEmail(email);
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate new OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createOtp({
        userId: user.id,
        mobile: mobile || undefined,
        email: email || undefined,
        code: otp,
        type,
        expiresAt,
      });

      console.log(`[DEV] Resent OTP for ${identifier}: ${otp}`);

      res.json({ 
        message: "OTP sent successfully",
        devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, rememberMe } = req.body;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT
      const expiresIn = rememberMe ? REMEMBER_ME_EXPIRES_IN : JWT_EXPIRES_IN;
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn });

      // Create session for remember me
      if (rememberMe) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await storage.createSession({
          userId: user.id,
          token,
          expiresAt,
        });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: "Login successful",
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user!;
    res.json({ user: userWithoutPassword });
  });

  // Forgot Password - Request OTP
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { identifier, method } = req.body;

      let user;
      if (method === "email") {
        user = await storage.getUserByEmail(identifier);
      } else {
        user = await storage.getUserByMobile(identifier);
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createOtp({
        userId: user.id,
        mobile: method === "mobile" ? identifier : undefined,
        email: method === "email" ? identifier : undefined,
        code: otp,
        type: "forgot_password",
        expiresAt,
      });

      console.log(`[DEV] Password reset OTP for ${identifier}: ${otp}`);

      res.json({ 
        message: "OTP sent successfully",
        devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Verify Reset OTP
  app.post("/api/auth/verify-reset-otp", async (req, res) => {
    try {
      const { identifier, code, method } = req.body;

      let otp;
      if (method === "email") {
        otp = await storage.getOtpByEmailAndCode(identifier, code, "forgot_password");
      } else {
        otp = await storage.getOtpByMobileAndCode(identifier, code, "forgot_password");
      }

      if (!otp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      res.json({ message: "OTP verified", valid: true });
    } catch (error) {
      console.error("Verify reset OTP error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset Password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { identifier, method, code, password } = req.body;

      let otp;
      if (method === "email") {
        otp = await storage.getOtpByEmailAndCode(identifier, code, "forgot_password");
      } else {
        otp = await storage.getOtpByMobileAndCode(identifier, code, "forgot_password");
      }

      if (!otp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user password
      if (otp.userId) {
        await storage.updateUser(otp.userId, { password: hashedPassword });
      }

      // Mark OTP as used
      await storage.markOtpAsUsed(otp.id);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============= CHAT ROUTES =============

  app.post("/api/chat", authMiddleware, async (req, res) => {
    try {
      const { message } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get all PDFs and external links
      const allPdfs = await storage.getAllPdfs();
      const allLinks = await storage.getAllExternalLinks();

      // Configure Fuse.js for fuzzy search on PDFs
      const fuse = new Fuse(allPdfs, {
        keys: [
          { name: "title", weight: 0.4 },
          { name: "author", weight: 0.2 },
          { name: "category", weight: 0.2 },
          { name: "description", weight: 0.1 },
          { name: "tags", weight: 0.1 },
        ],
        threshold: 0.4,
        includeScore: true,
      });

      // Search for PDFs
      const pdfResults = fuse.search(message);
      const topPdfs = pdfResults.slice(0, 3).map((r) => r.item);

      // Search for external links
      const linkResults = allLinks.filter((link) =>
        link.title.toLowerCase().includes(message.toLowerCase()) ||
        link.description?.toLowerCase().includes(message.toLowerCase())
      );
      const topLinks = linkResults.slice(0, 3);

      // Build response message
      let responseMessage = "";
      if (topPdfs.length === 0 && topLinks.length === 0) {
        responseMessage = "I couldn't find any matching resources. Try different keywords or ask for a specific subject.";
      } else if (topPdfs.length > 0 && topLinks.length === 0) {
        responseMessage = topPdfs.length === 1
          ? "I found a perfect match for you!"
          : `I found ${topPdfs.length} matching books:`;
      } else if (topPdfs.length === 0 && topLinks.length > 0) {
        responseMessage = topLinks.length === 1
          ? "I found an external resource for you:"
          : `I found ${topLinks.length} external resources:`;
      } else {
        responseMessage = `I found ${topPdfs.length} books and ${topLinks.length} external resources:`;
      }

      res.json({
        message: responseMessage,
        pdfs: topPdfs,
        externalLinks: topLinks,
        totalResults: topPdfs.length + topLinks.length,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============= PDF ROUTES =============

  // Get user downloads
  app.get("/api/downloads", authMiddleware, async (req, res) => {
    try {
      const downloads = await storage.getUserDownloads(req.user!.id);
      res.json(downloads);
    } catch (error) {
      console.error("Get downloads error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Record download
  app.post("/api/pdfs/:id/download", authMiddleware, async (req, res) => {
    try {
      const pdf = await storage.getPdf(req.params.id);
      if (!pdf) {
        return res.status(404).json({ message: "PDF not found" });
      }

      // Record download
      await storage.createDownloadHistory({
        userId: req.user!.id,
        pdfId: pdf.id,
      });

      // Increment user download count
      await storage.incrementUserDownloads(req.user!.id);

      // Get updated user to return count
      const user = await storage.getUser(req.user!.id);

      res.json({ message: "Download recorded", totalDownloads: user?.totalDownloads || 0 });
    } catch (error) {
      console.error("Record download error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get PDF file
  app.get("/api/pdfs/:id/file", authMiddleware, async (req, res) => {
    try {
      const pdf = await storage.getPdf(req.params.id);
      if (!pdf) {
        return res.status(404).json({ message: "PDF not found" });
      }

      const filePath = path.join(uploadsDir, pdf.filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Get file size
      const fileSize = fs.statSync(filePath).size;

      // Set headers for download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${pdf.title}.pdf"`);
      res.setHeader("Content-Length", fileSize);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on("error", (error) => {
        console.error("File stream error:", error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Failed to download file" });
        }
      });

      res.on("finish", () => {
        console.log(`Downloaded: ${pdf.title} by user ${req.user?.id}`);
      });
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============= ADMIN ROUTES =============

  // Get all PDFs (admin)
  app.get("/api/admin/pdfs", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const pdfs = await storage.getAllPdfs();
      res.json(pdfs);
    } catch (error) {
      console.error("Get admin PDFs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Upload PDF (admin)
  app.post(
    "/api/admin/pdfs",
    authMiddleware,
    adminMiddleware,
    upload.single("file"),
    async (req, res) => {
      try {
        const { title, author, category, description, tags } = req.body;
        const file = req.file;

        if (!file) {
          return res.status(400).json({ message: "PDF file is required" });
        }

        if (!title) {
          return res.status(400).json({ message: "Title is required" });
        }

        const tagsArray = tags ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];

        const pdf = await storage.createPdf({
          title: title || "Untitled",
          author: author || null,
          category: category || null,
          description: description || null,
          tags: tagsArray,
          filename: file.filename,
          fileSize: file.size,
        });

        res.status(201).json(pdf);
      } catch (error) {
        console.error("Upload PDF error:", error);
        res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
      }
    }
  );

  // Update PDF (admin)
  app.patch("/api/admin/pdfs/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { title, author, category, description, tags } = req.body;

      const updates: any = {};
      if (title) updates.title = title;
      if (author !== undefined) updates.author = author;
      if (category !== undefined) updates.category = category;
      if (description !== undefined) updates.description = description;
      if (tags !== undefined) updates.tags = tags;

      const pdf = await storage.updatePdf(req.params.id, updates);
      if (!pdf) {
        return res.status(404).json({ message: "PDF not found" });
      }

      res.json(pdf);
    } catch (error) {
      console.error("Update PDF error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete PDF (admin)
  app.delete("/api/admin/pdfs/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const pdf = await storage.getPdf(req.params.id);
      if (!pdf) {
        return res.status(404).json({ message: "PDF not found" });
      }

      // Delete file if exists
      const filePath = path.join(uploadsDir, pdf.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await storage.deletePdf(req.params.id);
      res.json({ message: "PDF deleted successfully" });
    } catch (error) {
      console.error("Delete PDF error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all external links (admin)
  app.get("/api/admin/links", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const links = await storage.getAllExternalLinks();
      res.json(links);
    } catch (error) {
      console.error("Get links error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add external link (admin)
  app.post("/api/admin/links", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { title, url, description } = req.body;

      const link = await storage.createExternalLink({
        title,
        url,
        description: description || null,
      });

      res.status(201).json(link);
    } catch (error) {
      console.error("Add link error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update external link (admin)
  app.patch("/api/admin/links/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { title, url, description } = req.body;

      const link = await storage.updateExternalLink(req.params.id, {
        title,
        url,
        description,
      });

      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }

      res.json(link);
    } catch (error) {
      console.error("Update link error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete external link (admin)
  app.delete("/api/admin/links/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      await storage.deleteExternalLink(req.params.id);
      res.json({ message: "Link deleted successfully" });
    } catch (error) {
      console.error("Delete link error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all users (admin)
  app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user download history (admin)
  app.get("/api/admin/users/:id/downloads", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const downloads = await storage.getUserDownloads(req.params.id);
      res.json(downloads);
    } catch (error) {
      console.error("Get user downloads error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}

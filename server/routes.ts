import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSummarySchema, insertEmailLogSchema } from "@shared/schema";
import { authMiddleware, generateToken, hashPassword, verifyPassword } from "./services/auth";
import { generateSummary } from "./services/gemini";
import { processFile } from "./services/fileProcessor";
import { sendSummaryEmail } from "./services/emailService";
import { generatePDF, generateDOCX } from "./services/exportService";
import multer from "multer";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['.txt', '.pdf', '.docx'];
    const fileExt = '.' + file.originalname.split('.').pop()?.toLowerCase();
    cb(null, allowedTypes.includes(fileExt));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      
      // Generate JWT token
      const token = generateToken(user.id);
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName,
          theme: user.theme 
        }, 
        token 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string().min(1)
      }).parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT token
      const token = generateToken(user.id);
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName,
          theme: user.theme 
        }, 
        token 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(500).json({ message: "Invalid credentials" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    const user = await storage.getUser(req.userId!);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        fullName: user.fullName,
        theme: user.theme 
      } 
    });
  });

  app.patch("/api/auth/theme", authMiddleware, async (req, res) => {
    try {
      const { theme } = z.object({
        theme: z.enum(["light", "dark"])
      }).parse(req.body);
      
      await storage.updateUserTheme(req.userId!, theme);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Invalid theme value" });
    }
  });

  // File upload route
  app.post("/api/upload", authMiddleware, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const extractedText = await processFile(req.file.path, req.file.mimetype);
      
      res.json({
        text: extractedText,
        filename: req.file.originalname,
        size: req.file.size
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to process file: " + error.message });
    }
  });

  // Summary routes
  app.post("/api/summaries", authMiddleware, async (req, res) => {
    try {
      const data = insertSummarySchema.parse(req.body);
      
      const summary = await storage.createSummary({
        ...data,
        userId: req.userId!
      });
      
      res.json(summary);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(500).json({ message: "Failed to create summary" });
    }
  });

  app.get("/api/summaries", authMiddleware, async (req, res) => {
    try {
      const summaries = await storage.getUserSummaries(req.userId!);
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch summaries" });
    }
  });

  app.get("/api/summaries/:id", authMiddleware, async (req, res) => {
    try {
      const summary = await storage.getSummary(req.params.id);
      if (!summary || summary.userId !== req.userId!) {
        return res.status(404).json({ message: "Summary not found" });
      }
      
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch summary" });
    }
  });

  app.patch("/api/summaries/:id", authMiddleware, async (req, res) => {
    try {
      const summary = await storage.getSummary(req.params.id);
      if (!summary || summary.userId !== req.userId!) {
        return res.status(404).json({ message: "Summary not found" });
      }
      
      const updates = z.object({
        summaryContent: z.string().optional(),
        status: z.string().optional(),
        autoSaved: z.boolean().optional(),
        wordCount: z.number().optional()
      }).parse(req.body);
      
      const updatedSummary = await storage.updateSummary(req.params.id, updates);
      res.json(updatedSummary);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(500).json({ message: "Failed to update summary" });
    }
  });

  // AI generate summary route
  app.post("/api/summaries/:id/generate", authMiddleware, async (req, res) => {
    try {
      const summary = await storage.getSummary(req.params.id);
      if (!summary || summary.userId !== req.userId!) {
        return res.status(404).json({ message: "Summary not found" });
      }
      
      const aiSummary = await generateSummary(summary.originalContent, summary.prompt, summary.tone);
      
      const updatedSummary = await storage.updateSummary(req.params.id, {
        summaryContent: aiSummary,
        wordCount: aiSummary.split(' ').length
      });
      
      res.json(updatedSummary);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to generate summary: " + error.message });
    }
  });

  // Export routes
  app.get("/api/summaries/:id/export/pdf", authMiddleware, async (req, res) => {
    try {
      const summary = await storage.getSummary(req.params.id);
      if (!summary || summary.userId !== req.userId!) {
        return res.status(404).json({ message: "Summary not found" });
      }
      
      const pdfBuffer = await generatePDF(summary);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${summary.title}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to generate PDF: " + error.message });
    }
  });

  app.get("/api/summaries/:id/export/docx", authMiddleware, async (req, res) => {
    try {
      const summary = await storage.getSummary(req.params.id);
      if (!summary || summary.userId !== req.userId!) {
        return res.status(404).json({ message: "Summary not found" });
      }
      
      const docxBuffer = await generateDOCX(summary);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${summary.title}.docx"`);
      res.send(docxBuffer);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to generate DOCX: " + error.message });
    }
  });

  // Email route
  app.post("/api/summaries/:id/email", authMiddleware, async (req, res) => {
    try {
      const summary = await storage.getSummary(req.params.id);
      if (!summary || summary.userId !== req.userId!) {
        return res.status(404).json({ message: "Summary not found" });
      }
      
      const { recipients, subject, format, ccSelf } = z.object({
        recipients: z.array(z.string().email()),
        subject: z.string(),
        format: z.enum(["html", "pdf", "both"]),
        ccSelf: z.boolean().optional()
      }).parse(req.body);
      
      const user = await storage.getUser(req.userId!);
      
      await sendSummaryEmail(summary, recipients, subject, format, user!, ccSelf);
      
      // Log the email
      await storage.createEmailLog({
        summaryId: summary.id,
        recipients,
        subject,
        format,
        status: "sent"
      });
      
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to send email: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

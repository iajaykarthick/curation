import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserPreferenceSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all curation items
  app.get("/api/curation-items", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const items = await storage.getCurationItems(limit, offset);
      const total = await storage.getCurationItemsCount();
      
      res.json({ items, total });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch curation items" });
    }
  });

  // Get specific curation item
  app.get("/api/curation-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getCurationItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Curation item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch curation item" });
    }
  });

  // Get user preference for an item
  app.get("/api/preferences/:itemId", async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const preference = await storage.getUserPreference(itemId);
      
      res.json(preference || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user preference" });
    }
  });

  // Save or update user preference
  app.post("/api/preferences", async (req, res) => {
    try {
      const validatedData = insertUserPreferenceSchema.parse(req.body);
      const preference = await storage.saveUserPreference(validatedData);
      
      res.json(preference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save user preference" });
    }
  });

  // Update user preference
  app.patch("/api/preferences/:itemId", async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const updates = req.body;
      
      const preference = await storage.updateUserPreference(itemId, updates);
      res.json(preference);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user preference" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

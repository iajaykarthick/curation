import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const curationItems = pgTable("curation_items", {
  id: serial("id").primaryKey(),
  inputData: text("input_data").notNull(),
  outputType: text("output_type").notNull(), // 'text', 'bounding-box', 'svg'
  modelAOutput: jsonb("model_a_output").notNull(),
  modelBOutput: jsonb("model_b_output").notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  preferredModel: text("preferred_model"), // 'a', 'b', or null
  modelAEdited: jsonb("model_a_edited"), // Array of edited texts
  modelBEdited: jsonb("model_b_edited"), // Array of edited texts
});

export const insertCurationItemSchema = createInsertSchema(curationItems).omit({
  id: true,
});

export const insertUserPreferenceSchema = createInsertSchema(userPreferences).omit({
  id: true,
}).extend({
  modelAEdited: z.array(z.string()).optional(),
  modelBEdited: z.array(z.string()).optional(),
});

export type CurationItem = typeof curationItems.$inferSelect;
export type InsertCurationItem = z.infer<typeof insertCurationItemSchema>;
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;

// Output type schemas
export const textOutputSchema = z.object({
  outputs: z.array(z.object({
    text: z.string(),
    confidence: z.number().optional(),
    wordCount: z.number().optional(),
    label: z.string().optional(),
  })),
});

export const boundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  label: z.string(),
  confidence: z.number(),
});

export const boundingBoxOutputSchema = z.object({
  imageUrl: z.string(),
  boxes: z.array(boundingBoxSchema),
  avgConfidence: z.number().optional(),
});

export const svgOutputSchema = z.object({
  svgContent: z.string(),
  fileSize: z.string().optional(),
  elementCount: z.number().optional(),
  complexity: z.enum(['Low', 'Medium', 'High']).optional(),
});

export type TextOutput = z.infer<typeof textOutputSchema>;
export type BoundingBoxOutput = z.infer<typeof boundingBoxOutputSchema>;
export type SvgOutput = z.infer<typeof svgOutputSchema>;

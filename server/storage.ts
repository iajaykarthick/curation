import { 
  curationItems, 
  userPreferences, 
  type CurationItem, 
  type InsertCurationItem,
  type UserPreference,
  type InsertUserPreference,
  type TextOutput,
  type BoundingBoxOutput,
  type SvgOutput
} from "@shared/schema";

export interface IStorage {
  getCurationItem(id: number): Promise<CurationItem | undefined>;
  getCurationItems(limit?: number, offset?: number): Promise<CurationItem[]>;
  getCurationItemsCount(): Promise<number>;
  createCurationItem(item: InsertCurationItem): Promise<CurationItem>;
  
  getUserPreference(itemId: number): Promise<UserPreference | undefined>;
  saveUserPreference(preference: InsertUserPreference): Promise<UserPreference>;
  updateUserPreference(itemId: number, updates: Partial<InsertUserPreference>): Promise<UserPreference>;
}

export class MemStorage implements IStorage {
  private curationItems: Map<number, CurationItem>;
  private userPreferences: Map<number, UserPreference>;
  private currentCurationId: number;
  private currentPreferenceId: number;

  constructor() {
    this.curationItems = new Map();
    this.userPreferences = new Map();
    this.currentCurationId = 1;
    this.currentPreferenceId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Text example
    const textItem: CurationItem = {
      id: 1,
      inputData: "Analyze the following customer feedback and provide a sentiment score along with key themes: \"The product arrived quickly and was well-packaged. However, the quality didn't meet my expectations based on the price point. Customer service was helpful when I reached out about the issue.\"",
      outputType: "text",
      modelAOutput: {
        outputs: [
          {
            text: "Sentiment Analysis Results:\n\nSentiment Score: 0.2 (Slightly Negative)\n\nKey Themes Identified:\n1. Delivery Experience: Positive (quick delivery, good packaging)\n2. Product Quality: Negative (didn't meet expectations, price-quality mismatch)\n3. Customer Service: Positive (helpful support team)\n\nOverall Assessment: Mixed sentiment with delivery and service positives offsetting product quality concerns.",
            confidence: 87,
            wordCount: 45,
            label: "Main Analysis"
          },
          {
            text: "Alternative interpretation: The customer shows appreciation for logistics and support but has concerns about value proposition. This suggests pricing strategy review may be needed.",
            confidence: 78,
            wordCount: 25,
            label: "Secondary Insight"
          }
        ]
      } as TextOutput,
      modelBOutput: {
        outputs: [
          {
            text: "Customer Feedback Analysis:\n\nOverall Sentiment: NEUTRAL (Score: 0.1)\n\nDetailed Breakdown:\n• Logistics & Delivery: POSITIVE\n  - Fast shipping mentioned\n  - Good packaging quality\n  \n• Product Experience: NEGATIVE  \n  - Quality below expectations\n  - Price-value mismatch indicated\n  \n• Support Experience: POSITIVE\n  - Customer service responsiveness\n  - Helpful interaction noted\n\nRecommendation: Address product quality concerns while maintaining current delivery and support standards.",
            confidence: 94,
            wordCount: 52,
            label: "Primary Analysis"
          },
          {
            text: "Risk Assessment: Customer retention risk is moderate. Strong service experience creates opportunity for recovery through product improvements.",
            confidence: 85,
            wordCount: 20,
            label: "Risk Evaluation"
          },
          {
            text: "Action Items:\n1. Quality control review\n2. Price-value assessment\n3. Customer follow-up recommended",
            confidence: 91,
            wordCount: 15,
            label: "Actionable Recommendations"
          }
        ]
      } as TextOutput
    };

    // Bounding box example
    const bboxItem: CurationItem = {
      id: 2,
      inputData: "Detect objects in this street scene image",
      outputType: "bounding-box",
      modelAOutput: {
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        boxes: [
          { x: 48, y: 32, width: 96, height: 64, label: "Car", confidence: 0.92 },
          { x: 320, y: 64, width: 64, height: 128, label: "Person", confidence: 0.87 },
          { x: 128, y: 16, width: 48, height: 32, label: "Sign", confidence: 0.95 }
        ],
        avgConfidence: 91.3
      } as BoundingBoxOutput,
      modelBOutput: {
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        boxes: [
          { x: 48, y: 32, width: 112, height: 72, label: "Vehicle", confidence: 0.89 },
          { x: 320, y: 64, width: 72, height: 144, label: "Pedestrian", confidence: 0.91 },
          { x: 128, y: 16, width: 56, height: 40, label: "Traffic Sign", confidence: 0.88 },
          { x: 32, y: 192, width: 80, height: 48, label: "Building", confidence: 0.76 }
        ],
        avgConfidence: 86.0
      } as BoundingBoxOutput
    };

    // SVG example
    const svgItem: CurationItem = {
      id: 3,
      inputData: "Generate an SVG icon representing \"data analysis\" with the following requirements:\n• Simple, modern design\n• Scalable to 24x24 and 48x48 pixels\n• Use blue color scheme (#1976D2)\n• Include chart/graph elements",
      outputType: "svg",
      modelAOutput: {
        svgContent: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13l4-4 4 4 8-8" stroke="#1976D2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 5h4v4" stroke="#1976D2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="17" width="2" height="4" fill="#1976D2"/><rect x="7" y="15" width="2" height="6" fill="#1976D2"/><rect x="11" y="13" width="2" height="8" fill="#1976D2"/></svg>',
        fileSize: "2.1 KB",
        elementCount: 12,
        complexity: "Low"
      } as SvgOutput,
      modelBOutput: {
        svgContent: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" stroke="#1976D2" stroke-width="2"/><path d="M12 4l3 8h-6z" fill="#1976D2"/><path d="M12 12l6 3-3-6z" fill="#1976D2" opacity="0.7"/><path d="M12 12l-3 6-3-6z" fill="#1976D2" opacity="0.5"/><rect x="2" y="20" width="20" height="2" fill="#1976D2" opacity="0.3"/></svg>',
        fileSize: "3.7 KB",
        elementCount: 18,
        complexity: "Medium"
      } as SvgOutput
    };

    this.curationItems.set(1, textItem);
    this.curationItems.set(2, bboxItem);
    this.curationItems.set(3, svgItem);
    this.currentCurationId = 4;
  }

  async getCurationItem(id: number): Promise<CurationItem | undefined> {
    return this.curationItems.get(id);
  }

  async getCurationItems(limit = 10, offset = 0): Promise<CurationItem[]> {
    const items = Array.from(this.curationItems.values())
      .sort((a, b) => a.id - b.id)
      .slice(offset, offset + limit);
    return items;
  }

  async getCurationItemsCount(): Promise<number> {
    return this.curationItems.size;
  }

  async createCurationItem(insertItem: InsertCurationItem): Promise<CurationItem> {
    const id = this.currentCurationId++;
    const item: CurationItem = { ...insertItem, id };
    this.curationItems.set(id, item);
    return item;
  }

  async getUserPreference(itemId: number): Promise<UserPreference | undefined> {
    return Array.from(this.userPreferences.values()).find(
      (pref) => pref.itemId === itemId
    );
  }

  async saveUserPreference(insertPreference: InsertUserPreference): Promise<UserPreference> {
    const existing = await this.getUserPreference(insertPreference.itemId);
    
    if (existing) {
      return this.updateUserPreference(insertPreference.itemId, insertPreference);
    }

    const id = this.currentPreferenceId++;
    const preference: UserPreference = { 
      ...insertPreference, 
      id,
      preferredModel: insertPreference.preferredModel || null,
      modelAEdited: insertPreference.modelAEdited || null,
      modelBEdited: insertPreference.modelBEdited || null
    };
    this.userPreferences.set(id, preference);
    return preference;
  }

  async updateUserPreference(itemId: number, updates: Partial<InsertUserPreference>): Promise<UserPreference> {
    const existing = await this.getUserPreference(itemId);
    
    if (!existing) {
      throw new Error(`Preference for item ${itemId} not found`);
    }

    const updated: UserPreference = { 
      ...existing, 
      ...updates,
      preferredModel: updates.preferredModel !== undefined ? updates.preferredModel : existing.preferredModel,
      modelAEdited: updates.modelAEdited !== undefined ? updates.modelAEdited : existing.modelAEdited,
      modelBEdited: updates.modelBEdited !== undefined ? updates.modelBEdited : existing.modelBEdited
    };
    this.userPreferences.set(existing.id, updated);
    return updated;
  }
}

export const storage = new MemStorage();

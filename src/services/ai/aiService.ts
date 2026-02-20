import { GoogleGenAI } from "@google/genai";
import { AIToolId, AIToolConfig, DealCoachResult } from "../../features/ai/types";

export class AIService {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-3-flash-preview") {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  public async generate(prompt: string, systemInstruction?: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction,
        },
      });
      return response.text || "";
    } catch (error) {
      console.error("AI Generation Error:", error);
      throw error;
    }
  }

  async runTool(tool: AIToolConfig, variables: Record<string, any>, systemInstruction?: string): Promise<string> {
    let prompt = tool.basePrompt;
    
    // Simple variable replacement
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return this.generate(prompt, systemInstruction);
  }

  async generateSalesScript(tool: AIToolConfig, dealTitle: string, scriptType: string, context: string): Promise<string> {
    return this.runTool(tool, { dealTitle, scriptType, context });
  }

  async generateDailyBriefing(tool: AIToolConfig, dataJson: string): Promise<string> {
    return this.runTool(tool, { dataJson });
  }

  async analyzeDeal(tool: AIToolConfig, dealTitle: string, dealValue: string, stageLabel: string, probability: number): Promise<DealCoachResult> {
    let prompt = tool.basePrompt;
    const variables = { dealTitle, dealValue, stageLabel, probability };
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
    });

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse deal analysis JSON", e);
      throw new Error("Invalid AI response format");
    }
  }

  async generateEmailDraft(tool: AIToolConfig, contactName: string, companyName: string, dealTitle: string): Promise<string> {
    return this.runTool(tool, { contactName, companyName, dealTitle });
  }

  async handleObjection(tool: AIToolConfig, objection: string, dealTitle: string): Promise<string> {
    return this.runTool(tool, { objection, dealTitle });
  }

  async generateBoardStructure(tool: AIToolConfig, description: string, lifecycleJson: string): Promise<string> {
    return this.runTool(tool, { description, lifecycleJson });
  }

  async generateBoardStrategy(tool: AIToolConfig, boardName: string): Promise<string> {
    return this.runTool(tool, { boardName });
  }

  async refineBoard(tool: AIToolConfig, userInstruction: string, boardContext: string, historyContext: string): Promise<string> {
    return this.runTool(tool, { userInstruction, boardContext, historyContext });
  }
}

export const createAIService = (apiKey: string, model?: string) => {
  return new AIService(apiKey, model);
};

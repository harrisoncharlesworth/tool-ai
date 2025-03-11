import { OpenAI } from 'openai';
import { z } from 'zod';
import { ToolConfig, ToolResult } from '../types';

export class ToolAI {
  private openai: OpenAI;
  private tools: Map<string, ToolConfig>;

  constructor(config: { apiKey: string }) {
    this.openai = new OpenAI({ apiKey: config.apiKey });
    this.tools = new Map();
  }

  /**
   * Register a new tool with the AI
   */
  public registerTool(name: string, config: ToolConfig): void {
    this.tools.set(name, config);
  }

  /**
   * Execute a natural language command
   */
  public async execute(command: string): Promise<ToolResult> {
    try {
      // Analyze command to determine intent and parameters
      const analysis = await this.analyzeCommand(command);

      // Find matching tool
      const tool = this.tools.get(analysis.tool);
      if (!tool) {
        throw new Error(`No tool found for command: ${command}`);
      }

      // Validate parameters
      const validatedParams = tool.schema.parse(analysis.parameters);

      // Execute tool function
      return await tool.execute(validatedParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid parameters: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Analyze a natural language command to determine intent and parameters
   */
  private async analyzeCommand(command: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI tool parser. Given a command, determine:
            1. Which tool to use from: ${Array.from(this.tools.keys()).join(', ')}
            2. What parameters to pass to the tool
            Respond in JSON format with "tool" and "parameters" keys.`
        },
        {
          role: 'user',
          content: command
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      tool: result.tool as string,
      parameters: result.parameters as Record<string, unknown>
    };
  }
} 
import { z } from 'zod';

export interface ToolConfig {
  name: string;
  description: string;
  schema: z.ZodSchema;
  execute: (params: unknown) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
} 
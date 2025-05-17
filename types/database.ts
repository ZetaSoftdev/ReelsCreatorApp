// This is a temporary type definition file to work around Prisma generation issues

// Extend the Video model with our new fields for TypeScript compatibility
export interface VideoWithExternalFields {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  originalUrl: string;
  duration: number;
  fileSize: number;
  uploadedAt: Date;
  status: string;
  processedAt: Date | null;
  uploadPath: string;
  error: string | null;
  externalJobId?: string | null;
  lastStatusCheck?: Date | null;
  clips?: any[];
  user?: any;
} 
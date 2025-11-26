export interface UploadResponse {
  resumeId: string;
  analysisId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;
  timestamp: string;
  uploadedAt?: string;
  message?: string;
}

export interface AnalysisResponse {
  resumeId: string;
  analysisId: string;
  atsScore: number;
  technicalSkills: string[];
  softSkills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestedRoles: string[];
  missingKeywords: string[];
  summary: string;
  shortSummary?: string;
  createdAt: string;
  analyzedAt?: string;
  status?: string;
}

export interface ScoreResponse {
  resumeId: string;
  atsScore: number;
  shortSummary: string;
  createdAt: string;
}

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

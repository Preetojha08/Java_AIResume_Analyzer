import { AnalysisResponse, ApiError, JobFitRequest, JobFitResponse, ScoreResponse, UploadResponse } from '../types/resume';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

const withApiKey = (init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers || {});
  if (API_KEY) {
    headers.set('X-API-KEY', API_KEY);
  }
  return { ...init, headers };
};

const ensureBaseUrl = () => {
  if (!BASE_URL) {
    const err = new Error('Missing VITE_API_BASE_URL. Set it in frontend/.env.local') as ApiError;
    err.status = 0;
    throw err;
  }
};

const parseError = async (response: Response) => {
  let message = 'Something went wrong. Please try again.';
  try {
    const data = await response.json();
    message = data.message ?? data.error ?? JSON.stringify(data);
    return { message, data };
  } catch {
    const text = await response.text();
    message = text || message;
    return { message, data: text };
  }
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const { message, data } = await parseError(response);
    const error = new Error(message) as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return response.json() as Promise<T>;
};

export const uploadResume = async (file: File): Promise<UploadResponse> => {
  ensureBaseUrl();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/api/resumes/upload`, withApiKey({ method: 'POST', body: formData }));
  return handleResponse<UploadResponse>(response);
};

export const getAnalysis = async (resumeId: string): Promise<AnalysisResponse> => {
  ensureBaseUrl();
  const response = await fetch(`${BASE_URL}/api/resumes/${resumeId}/analysis`, withApiKey({ method: 'GET' }));
  return handleResponse<AnalysisResponse>(response);
};

export const getScore = async (resumeId: string): Promise<ScoreResponse> => {
  ensureBaseUrl();
  const response = await fetch(`${BASE_URL}/api/resumes/${resumeId}/score`, withApiKey({ method: 'GET' }));
  return handleResponse<ScoreResponse>(response);
};

export const deleteResume = async (resumeId: string): Promise<void> => {
  ensureBaseUrl();
  const response = await fetch(`${BASE_URL}/api/resumes/${resumeId}`, withApiKey({ method: 'DELETE' }));
  if (!response.ok && response.status !== 204) {
    const { message, data } = await parseError(response);
    const error = new Error(message) as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }
};

export const createJobFit = async (resumeId: string, payload: JobFitRequest): Promise<JobFitResponse> => {
  ensureBaseUrl();
  const response = await fetch(`${BASE_URL}/api/resumes/${resumeId}/job-fit`, withApiKey({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
  return handleResponse<JobFitResponse>(response);
};

export const listJobFits = async (resumeId: string): Promise<JobFitResponse[]> => {
  ensureBaseUrl();
  const response = await fetch(`${BASE_URL}/api/resumes/${resumeId}/job-fit`, withApiKey({ method: 'GET' }));
  return handleResponse<JobFitResponse[]>(response);
};

export const getJobFit = async (resumeId: string, jobFitId: string): Promise<JobFitResponse> => {
  ensureBaseUrl();
  const response = await fetch(`${BASE_URL}/api/resumes/${resumeId}/job-fit/${jobFitId}`, withApiKey({ method: 'GET' }));
  return handleResponse<JobFitResponse>(response);
};

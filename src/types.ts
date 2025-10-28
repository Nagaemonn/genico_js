/**
 * Type definitions for Genico Server
 */

/**
 * Server configuration interface
 */
export interface ServerConfig {
  /** Server port number */
  port: number;
  /** Template directory path */
  templateDir: string;
  /** Default port number */
  defaultPort: number;
}

/**
 * Template context for HTML template rendering
 */
export interface TemplateContext {
  /** Key-value pairs for template variable substitution */
  [key: string]: string | number | boolean;
}

/**
 * File upload result from multipart form parsing
 */
export interface FileUploadResult {
  /** Original filename */
  filename: string;
  /** File data as buffer */
  fileData: Buffer;
}

/**
 * Image validation result
 */
export interface ImageValidationResult {
  /** Whether the image is valid */
  isValid: boolean;
  /** Array of validation warning messages */
  warnings: string[];
}

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Content type mappings
 */
export interface ContentTypeMap {
  html: 'text/html; charset=utf-8';
  css: 'text/css; charset=utf-8';
  ico: 'image/x-icon';
  png: 'image/png';
  json: 'application/json';
  octet: 'application/octet-stream';
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  /** Error message */
  message: string;
  /** HTTP status code */
  statusCode: number;
  /** Additional error details */
  details?: any;
}

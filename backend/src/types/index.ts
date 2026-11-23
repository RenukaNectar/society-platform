import { Request, Response, NextFunction } from 'express';

// API Version types
export type ApiVersion = 'v1' | 'v2' | 'v3';

// Auth related types
export interface IRegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  aadhar_number?: string;
  pan_number?: string;
  confirm_password: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface ISendOtpRequest {
  email: string;
}

export interface IVerifyOtpRequest {
  email: string;
  otp: string;
}

export interface IResetPasswordRequest {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
}

export interface IAuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;
    district_id?: string;
    state_id?: string;
    role_id?: string;
    is_hq?: boolean;
  };
}

// User related types
export interface IUser {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  aadhar_number?: string;
  pan_number?: string;
  role_id: string;
  is_active: boolean;
  is_available?: boolean;
  unavailable_since?: Date | null;
  unavailable_until?: Date | null;
  unavailable_reason?: string | null;
  is_hq: boolean;
  is_locked: boolean;
  locked_at?: Date;
  failed_login_attempts: number;
  token_version: number;
  last_login?: Date;
  reset_token?: string;
  reset_token_expiry?: Date;
  otp?: string;
  otp_expiry?: Date;
  failed_otp_attempts?: number;
  otp_locked_until?: Date;
  is_email_verified?: boolean;
  state_id?: string;
  district_id?: string;
  signature_media_id?: string;
  created_at: Date;
  updated_at: Date;
  permissions?: any[];
  role?: {
    id: string;
    name: string;
    description?: string;
  };
  society?: any;
  district?: any;
  state?: any;
}

export interface IUserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  aadhar_number?: string;
  pan_number?: string;
  role_id?: string;
  is_email_verified?: boolean;
  state_id?: string;
  district_id?: string;
  signature_media_id?: string;
}

export interface IUserUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  aadhar_number?: string;
  pan_number?: string;
  is_active?: boolean;
  is_hq?: boolean;
  is_locked?: boolean;
  locked_at?: Date;
  failed_login_attempts?: number;
  token_version?: number;
  role_id?: string;
  last_login?: Date;
  reset_token?: string;
  reset_token_expiry?: Date;
  otp?: string;
  otp_expiry?: Date;
  failed_otp_attempts?: number;
  otp_locked_until?: Date;
  is_email_verified?: boolean;
  state_id?: string;
  district_id?: string;
  is_available?: boolean;
  unavailable_since?: Date | null;
  unavailable_until?: Date | null;
  unavailable_reason?: string | null;
}

// Role related types
export interface IRole {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IRoleCreate {
  name: string;
  description?: string;
}

export interface IRoleUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// Permission related types
export interface IPermission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IPermissionCreate {
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface IPermissionUpdate {
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
  is_active?: boolean;
}

// Authentication types
export interface IAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: Omit<IUser, 'password' | 'reset_token'>;
}

// API Response types
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: IPagination;
  version: ApiVersion;
  timestamp: string;
  society?: any;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Database types
export interface IDatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

// Middleware types
export interface IMiddleware {
  (req: Request, res: Response, next: NextFunction): void | Promise<void>;
}

// Route types
export interface IRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: (req: Request, res: Response) => void | Promise<void>;
  middleware?: IMiddleware[];
  version?: ApiVersion;
}

// Error types
export interface IAppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
}

// Validation types
export interface IValidationRule {
  field: string;
  rules: string[];
  message?: string;
}

// Logging types
export interface ILogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  meta?: Record<string, any>;
}

// Session types
export interface ISession {
  id: string;
  user_id: string;
  expires: Date;
  data: any;
  created_at: Date;
  updated_at: Date;
}

// Email types
export interface IEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

// File upload types
export interface IFileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Environment types
export interface IEnvironment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  JWT_SECRET: string;
  SESSION_SECRET: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireFields<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// Notification types
export interface INotification {
  id: string;
  title: string;
  description?: string;
  redirect_path?: string;
  data?: any;
  is_read: boolean;
  created_by?: string; // Allow null for system-generated notifications
  notification_template_id?: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  createdByUser?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  notificationTemplate?: {
    id: string;
    title: string;
    key: string;
    description?: string;
  };
}

export interface IUserNotification {
  id: string;
  user_id: string;
  notification_id: string;
  is_read: boolean;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  notification?: INotification;
  user?: any;
}

export interface IUserNotificationCreate {
  user_id: string;
  notification_id: string;
  is_read?: boolean;
  active?: boolean;
}

export interface INotificationCreate {
  title: string;
  description?: string;
  redirect_path?: string;
  data?: any;
  created_by?: string; // Allow null for system-generated notifications
  notification_template_id?: string | null; // Link to notification template
}

export interface INotificationUpdate {
  title?: string;
  description?: string;
  redirect_path?: string;
  data?: any;
  is_read?: boolean;
  active?: boolean;
}

// Notification Template types
export interface INotificationTemplate {
  id: string;
  title: string;
  key: string;
  description?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface INotificationTemplateCreate {
  title: string;
  key: string;
  description?: string;
  active?: boolean;
}

export interface INotificationTemplateUpdate {
  title?: string;
  key?: string;
  description?: string;
  active?: boolean;
}

// Status types
export interface IStatus {
  id: string;
  key: string;
  title: string;
  description?: string;
  is_active: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface IStatusCreate {
  key: string;
  title: string;
  description?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface IStatusUpdate {
  key?: string;
  title?: string;
  description?: string;
  is_active?: boolean;
  updated_by?: string;
}

// Media related types
export interface IMedia {
  id: string;
  url: string;
  created_by: string | null;
  updated_by: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  createdByUser?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  updatedByUser?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface IMediaCreate {
  url: string;
  created_by?: string | null;
  updated_by?: string | null;
  active?: boolean;
}

export interface IMediaUpdate {
  url?: string;
  active?: boolean;
  updated_by?: string | null;
}

// SocietiesMedia related types
export interface ISocietiesMedia {
  id: string;
  society_id: string;
  media_type: string;
  media_id: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  society?: {
    id: string;
    society_id: string;
    cooperative_society_name: string | null;
  };
  media?: {
    id: string;
    url: string;
    active: boolean;
  };
}

export interface ISocietiesMediaCreate {
  society_id: string;
  media_type: string;
  media_id: string;
  active?: boolean;
}

export interface ISocietiesMediaUpdate {
  media_type?: string;
  active?: boolean;
}

// History related types
export interface IHistory {
  id: string;
  resource: string;
  type: string;
  comments?: string;
  reference_id: string;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
  active: boolean;
  data?: any;
  createdByUser?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface IHistoryCreate {
  resource: string;
  type: string;
  comments?: string;
  reference_id: string;
  created_by?: string | null;
  active?: boolean;
  data?: any;
}

export interface IHistoryUpdate {
  comments?: string;
  active?: boolean;
}

// Setting related types
export interface ISetting {
  id: string;
  key: string;
  title: string;
  description?: string;
  value: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ISettingCreate {
  key: string;
  title: string;
  description?: string;
  value: string;
  is_active?: boolean;
}

export interface ISettingUpdate {
  key?: string;
  title?: string;
  description?: string;
  value?: string;
  is_active?: boolean;
}

// ModuleWorkflow related types
export interface IModuleWorkflow {
  id: string;
  module_id: string;
  sequence: number;
  allowed_role_id?: string | string[] | null;
  approval_status_id?: string | null;
  approval_notification_template_id?: string | null;
  approval_send_to?: string | null;
  approval_documents?: string[] | null;
  reject_role_id?: string | string[] | null;
  reject_status_id?: string | null;
  reject_notification_template_id?: string | null;
  reject_send_to?: string | null;
  reject_documents?: string[] | null;
  assigned_to?: string | string[] | null;
  is_hq: boolean;
  active: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface IModuleWorkflowCreate {
  module_id: string;
  sequence: number;
  allowed_role_id?: string | string[] | null;
  approval_status_id?: string | null;
  approval_notification_template_id?: string | null;
  approval_send_to?: string | null;
  approval_documents?: string[] | null;
  reject_role_id?: string | string[] | null;
  reject_status_id?: string | null;
  reject_notification_template_id?: string | null;
  reject_send_to?: string | null;
  reject_documents?: string[] | null;
  assigned_to?: string | string[] | null;
  is_hq?: boolean;
  active?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface IModuleWorkflowUpdate {
  module_id?: string;
  sequence?: number;
  allowed_role_id?: string;
  approval_status_id?: string | null;
  approval_notification_template_id?: string | null;
  approval_send_to?: string | null;
  approval_documents?: string[] | null;
  reject_role_id?: string | string[] | null;
  reject_status_id?: string | null;
  reject_notification_template_id?: string | null;
  reject_send_to?: string | null;
  reject_documents?: string[] | null;
  assigned_to?: string | string[] | null;
  is_hq?: boolean;
  active?: boolean;
  updated_by?: string | null;
}

// SocietyRenewal related types
export interface ISocietyRenewal {
  id: string;
  society_id: string;
  challan_url: string | null;
  submit_date: Date | null;
  status: string | null;
  workflow_status: string | null;
  assigned_to_user_id: string | null;
  renewal_certificate_url: string | null;
  certificate_issue_date: Date | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  society?: any;
  statusDetails?: {
    id: string;
    key: string;
    title: string;
  };
  createdByUser?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  updatedByUser?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ISocietyRenewalCreate {
  society_id: string;
  challan_url?: string | null;
  submit_date?: Date | null;
  status?: string | null;
  workflow_status?: string | null;
  assigned_to_user_id?: string | null;
  renewal_certificate_url?: string | null;
  certificate_issue_date?: Date | null;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ISocietyRenewalUpdate {
  challan_url?: string | null;
  submit_date?: Date | null;
  status?: string | null;
  workflow_status?: string | null;
  assigned_to_user_id?: string | null;
  renewal_certificate_url?: string | null;
  certificate_issue_date?: Date | null;
  updated_by?: string | null;
}

export enum Language {
  ENGLISH = 'en',
  HINDI = 'hi',
  MARATHI = 'mr'
}

export enum Department {
  ELECTRICITY = 'Electricity',
  GAS = 'Gas Distribution',
  MUNICIPAL = 'Municipal Services'
}

export enum ServiceStatus {
  SUBMITTED = 'Submitted',
  UNDER_REVIEW = 'Under Review',
  ASSIGNED = 'Assigned',
  RESOLVED = 'Resolved'
}

export interface User {
  mobile: string;
  name: string;
  id: string;
}

export interface Complaint {
  id: string;
  department: Department;
  serviceType: string;
  description: string;
  status: ServiceStatus;
  timestamp: string;
  userId: string;
  attachmentName?: string;
}

export interface Translation {
  welcome: string;
  selectLanguage: string;
  loginTitle: string;
  enterMobile: string;
  getOtp: string;
  verifyOtp: string;
  homeTitle: string;
  trackStatus: string;
  fileComplaint: string;
  adminLogin: string;
  back: string;
  submit: string;
  close: string;
  complaintSuccess: string;
  requestId: string;
}

export type AppView = 'LANDING' | 'AUTH' | 'DASHBOARD' | 'SERVICES' | 'COMPLAINT_FORM' | 'STATUS' | 'ADMIN' | 'RECEIPT';

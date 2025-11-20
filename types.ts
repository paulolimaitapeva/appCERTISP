
export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface CertificateAuthority {
  id: string;
  name: string;
  apiUrl: string; // Placeholder para URL de integração futura
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Client {
  id: string;
  name: string;
  document: string; // CPF or CNPJ
  email: string;
  phone: string;
  type: 'PF' | 'PJ';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  validityMonths: number;
  type: 'A1' | 'A3' | 'CLOUD';
}

export enum AppointmentStatus {
  PENDING = 'PENDING', // Aguardando Agendamento
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Appointment {
  id: string;
  clientId: string;
  productId: string;
  acId: string; // Nova vinculação com a AC
  date?: string; // ISO string, optional for PENDING orders
  status: AppointmentStatus;
  notes?: string;
}

// Composite type for display
export interface OrderDisplay extends Appointment {
  clientName: string;
  productName: string;
  productPrice: number;
  acName: string;
}

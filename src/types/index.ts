export interface User {
  id: string;
  flowId: string;
  name: string;
  department: string;
  position: string;
  avatar?: string;
}

export interface Payment {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: Date;
  flowId: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt?: string;
  description?: string;
}

export interface Card {
  id: string;
  last4: string;
  type: 'corporate' | 'personal';
  isActive: boolean;
  balance: number;
  limit: number;
}

export interface Receipt {
  id: string;
  paymentId: string;
  imageUrl: string;
  merchant: string;
  amount: number;
  date: Date;
  items: ReceiptItem[];
  status: 'pending' | 'processed' | 'error';
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Department {
  id: string;
  name: string;
  budget: number;
  spent: number;
}

export interface Project {
  id: string;
  name: string;
  departmentId: string;
  budget: number;
  spent: number;
  startDate: Date;
  endDate: Date;
} 
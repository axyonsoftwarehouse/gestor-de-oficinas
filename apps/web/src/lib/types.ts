export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Customer {
  id: string;
  type: 'INDIVIDUAL' | 'COMPANY';
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  plate?: string | null;
  vin?: string | null;
  year?: number | null;
  odometer?: string | number | null;
  customerId: string;
  customer?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  model?: { id: string; name: string } | null;
}

export type JobStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'IN_INSPECTION'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'LOCKED';

export interface JobLine {
  id: string;
  type: string;
  description?: string | null;
  quantity: string | number;
  unitPrice: string | number;
  total: string | number;
}

export interface JobCard {
  id: string;
  number: string;
  type: string;
  status: JobStatus;
  customerId: string;
  customer?: { id: string; name: string } | null;
  vehicle?: { id: string; plate?: string | null } | null;
  total: string | number;
  subtotal: string | number;
  taxTotal: string | number;
  createdAt: string;
  lines?: JobLine[];
  statusHistory?: { id: string; toStatus: JobStatus; changedAt: string }[];
}

export interface Appointment {
  id: string;
  type: string;
  status: string;
  scheduledStart: string;
  customer?: { id: string; name: string } | null;
  vehicle?: { id: string; plate?: string | null } | null;
  notes?: string | null;
}

export interface Quotation {
  id: string;
  number: string;
  status: string;
  total: string | number;
  customer?: { id: string; name: string } | null;
  jobCard?: { id: string; number: string } | null;
  lines?: JobLine[];
}

export interface Invoice {
  id: string;
  number: string;
  status: string;
  total: string | number;
  amountPaid: string | number;
  issueDate: string;
  customer?: { id: string; name: string } | null;
  jobCard?: { id: string; number: string } | null;
  lines?: JobLine[];
  payments?: { id: string; amount: string | number; paidAt: string; reference?: string | null }[];
}

export interface Part {
  id: string;
  name: string;
  sku?: string | null;
  costPrice: string | number;
  salePrice: string | number;
  minStock: string | number;
}

export interface StockBalance {
  id: string;
  quantity: string | number;
  part: { id: string; name: string; sku?: string | null; minStock: string | number };
  location: { id: string; name: string };
}

export interface StockLocation {
  id: string;
  name: string;
  branchId: string;
}

export interface Purchase {
  id: string;
  number: string;
  status: string;
  total: string | number;
  purchaseDate: string;
  supplier?: { id: string; name: string } | null;
  items?: { id: string; quantity: string | number; unitCost: string | number }[];
}

export interface Supplier {
  id: string;
  name: string;
}

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
  state?: string | null;
  zip?: string | null;
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
  priority?: number;
  customer?: { id: string; name: string; phone?: string | null; email?: string | null } | null;
  vehicle?: {
    id: string;
    plate?: string | null;
    vin?: string | null;
    year?: number | null;
    brand?: { name: string } | null;
    model?: { name: string } | null;
  } | null;
  branch?: { id: string; name: string } | null;
  advisor?: { id: string; name: string } | null;
  odometerIn?: string | number | null;
  fuelLevel?: string | null;
  customerComplaint?: string | null;
  internalNotes?: string | null;
  total: string | number;
  subtotal: string | number;
  taxTotal: string | number;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  deliveredAt?: string | null;
  inspection?: { id: string; status: string } | null;
  invoices?: { id: string; number: string; status: string }[];
  _count?: { quotations: number; invoices: number };
  lines?: JobLine[];
  mechanics?: JobMechanic[];
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

export interface ServiceItem {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  basePrice: string | number;
  standardTime?: string | number | null;
  isActive: boolean;
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
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface Expense {
  id: string;
  branchId: string;
  jobCardId?: string | null;
  category: string;
  description?: string | null;
  amount: string | number;
  expenseDate: string;
  jobCard?: { id: string; number: string } | null;
}

export interface ExpenseList extends Paginated<Expense> {
  sum: string | number;
}

export interface StockMovement {
  id: string;
  type: string;
  quantity: string | number;
  unitCost?: string | number | null;
  refType?: string | null;
  refId?: string | null;
  createdAt: string;
  part?: { id: string; name: string; sku?: string | null } | null;
  location?: { id: string; name: string } | null;
}

export interface JobMechanic {
  userId: string;
  role?: string | null;
  hours?: string | number | null;
  user?: { id: string; name: string } | null;
}

export type InspectionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type InspectionResult =
  | 'OK'
  | 'ATTENTION'
  | 'REPAIR'
  | 'NOT_INSPECTED'
  | 'NOT_APPLICABLE';
export type ApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface InspectionOption {
  id: string;
  label: string;
  value: string;
}

export interface InspectionQuestion {
  id: string;
  code?: string | null;
  label: string;
  type: string;
  required: boolean;
  sequence: number;
  options: InspectionOption[];
  section?: { id: string; title: string; sequence: number };
}

export interface InspectionAnswer {
  id: string;
  questionId: string;
  value?: string | null;
  result: InspectionResult;
  comment?: string | null;
  approvalStatus: ApprovalStatus;
  question: InspectionQuestion;
}

export interface Inspection {
  id: string;
  status: InspectionStatus;
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  vehicle?: {
    id: string;
    plate?: string | null;
    brand?: { name: string } | null;
    model?: { name: string } | null;
  } | null;
  jobCard?: { id: string; number: string } | null;
  answers?: InspectionAnswer[];
  _count?: { answers: number };
}

export interface InspectionTemplateSection {
  id: string;
  title: string;
  displayType: string;
  sequence: number;
  questions: InspectionQuestion[];
}

export interface InspectionTemplateVersion {
  id: string;
  version: number;
  publishedAt?: string | null;
  sections: InspectionTemplateSection[];
}

export interface InspectionTemplate {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  versions?: InspectionTemplateVersion[];
  _count?: { versions: number };
}

export interface BranchFull {
  id: string;
  name: string;
  code?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
}

export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'DISABLED';

export interface RoleRef {
  id: string;
  name: string;
  slug: string;
}

export interface TeamMember {
  id: string;
  status: MembershipStatus;
  isOwner: boolean;
  user: { id: string; name: string; email: string; isActive: boolean };
  branch?: { id: string; name: string } | null;
  roles: { role: RoleRef }[];
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystem: boolean;
  permissions?: { permission: Permission }[];
  _count?: { permissions: number; memberships: number };
}

export interface Permission {
  id: string;
  code: string;
  feature: string;
  action: string;
}

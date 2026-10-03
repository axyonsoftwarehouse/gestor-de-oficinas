-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('SYSTEM', 'TENANT');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "OdometerUnit" AS ENUM ('KM', 'MILE');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('INSPECTION', 'REPAIR', 'SERVICE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'CHECKED_IN', 'IN_INSPECTION', 'WAITING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'DELIVERED', 'CANCELLED', 'LOCKED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('OK', 'ATTENTION', 'REPAIR', 'NOT_INSPECTED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'COLOR', 'ATTACHMENT', 'LINK');

-- CreateEnum
CREATE TYPE "SectionDisplayType" AS ENUM ('SECTION', 'NOTE');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LineItemType" AS ENUM ('LABOR', 'PART', 'SERVICE', 'FEE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'AMOUNT');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'PIX', 'OTHER');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('INITIAL', 'PURCHASE', 'ISSUE_TO_JOB', 'SALE', 'RETURN_IN', 'ADJUSTMENT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'COLOR', 'LINK');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "plan" TEXT,
    "document" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "branchId" UUID,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "scope" "RoleScope" NOT NULL DEFAULT 'TENANT',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "membership_roles" (
    "membershipId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "membership_roles_pkey" PRIMARY KEY ("membershipId","roleId")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "name" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_brands" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_types" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_colors" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_fuel_types" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_fuel_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "brandId" UUID,
    "modelId" UUID,
    "fuelTypeId" UUID,
    "colorId" UUID,
    "typeId" UUID,
    "plate" TEXT,
    "vin" TEXT,
    "chassis" TEXT,
    "engineNo" TEXT,
    "year" INTEGER,
    "transmission" "TransmissionType",
    "odometer" DECIMAL(12,2),
    "odometerUnit" "OdometerUnit" NOT NULL DEFAULT 'KM',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_history" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "jobCardId" UUID,
    "odometer" DECIMAL(12,2),
    "odometerUnit" "OdometerUnit" NOT NULL DEFAULT 'KM',
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(6,3) NOT NULL,
    "type" "TaxType" NOT NULL DEFAULT 'PERCENT',
    "isInclusive" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_catalogs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "categoryId" UUID,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "standardTime" DECIMAL(8,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "service_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_catalogs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "categoryId" UUID,
    "unitId" UUID,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "costPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "salePrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "minStock" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "part_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_parts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "partId" UUID NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL DEFAULT 1,

    CONSTRAINT "service_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_locations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "partId" UUID NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unitCost" DECIMAL(14,2),
    "refType" TEXT,
    "refId" UUID,
    "notes" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_balances" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "partId" UUID NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "customerId" UUID,
    "vehicleId" UUID,
    "type" "JobType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3),
    "assignedToId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_hours" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branchId" UUID,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_template_versions" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "inspection_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_sections" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "displayType" "SectionDisplayType" NOT NULL DEFAULT 'SECTION',
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inspection_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_questions" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "code" TEXT,
    "label" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "visibleToCustomer" BOOLEAN NOT NULL DEFAULT true,
    "helpText" TEXT,
    "conditionalParentId" UUID,
    "conditionalOperator" TEXT,
    "conditionalValue" TEXT,

    CONSTRAINT "inspection_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_question_options" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inspection_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "jobCardId" UUID,
    "vehicleId" UUID NOT NULL,
    "templateVersionId" UUID,
    "inspectorId" UUID,
    "status" "InspectionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_answers" (
    "id" UUID NOT NULL,
    "inspectionId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "value" TEXT,
    "result" "InspectionResult" NOT NULL DEFAULT 'NOT_INSPECTED',
    "comment" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_answer_attachments" (
    "id" UUID NOT NULL,
    "answerId" UUID NOT NULL,
    "attachmentId" UUID NOT NULL,

    CONSTRAINT "inspection_answer_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_cards" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "customerId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "appointmentId" UUID,
    "assignedToId" UUID,
    "advisorId" UUID,
    "odometerIn" DECIMAL(12,2),
    "odometerUnit" "OdometerUnit" NOT NULL DEFAULT 'KM',
    "fuelLevel" TEXT,
    "customerComplaint" TEXT,
    "internalNotes" TEXT,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "job_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_status_history" (
    "id" UUID NOT NULL,
    "jobCardId" UUID NOT NULL,
    "fromStatus" "JobStatus",
    "toStatus" "JobStatus" NOT NULL,
    "changedById" UUID,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_mechanics" (
    "id" UUID NOT NULL,
    "jobCardId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT,
    "hours" DECIMAL(8,2),

    CONSTRAINT "job_mechanics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_checklist_items" (
    "id" UUID NOT NULL,
    "jobCardId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "completedById" UUID,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "job_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_lines" (
    "id" UUID NOT NULL,
    "jobCardId" UUID NOT NULL,
    "type" "LineItemType" NOT NULL,
    "serviceId" UUID,
    "partId" UUID,
    "description" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL DEFAULT 1,
    "unitId" UUID,
    "unitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxBase" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sourceInspectionAnswerId" UUID,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_line_taxes" (
    "id" UUID NOT NULL,
    "lineId" UUID NOT NULL,
    "taxId" UUID NOT NULL,
    "rate" DECIMAL(6,3) NOT NULL,
    "base" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "job_line_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "jobCardId" UUID,
    "customerId" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "validUntil" TIMESTAMP(3),
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "notes" TEXT,
    "createdById" UUID,
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_lines" (
    "id" UUID NOT NULL,
    "quotationId" UUID NOT NULL,
    "type" "LineItemType" NOT NULL,
    "serviceId" UUID,
    "partId" UUID,
    "description" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL DEFAULT 1,
    "unitId" UUID,
    "unitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxBase" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quotation_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_line_taxes" (
    "id" UUID NOT NULL,
    "lineId" UUID NOT NULL,
    "taxId" UUID NOT NULL,
    "rate" DECIMAL(6,3) NOT NULL,
    "base" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "quotation_line_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "jobCardId" UUID,
    "quotationId" UUID,
    "customerId" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "notes" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "type" "LineItemType" NOT NULL,
    "serviceId" UUID,
    "partId" UUID,
    "description" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL DEFAULT 1,
    "unitId" UUID,
    "unitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxBase" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "quotationLineId" UUID,
    "jobLineId" UUID,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_taxes" (
    "id" UUID NOT NULL,
    "lineId" UUID NOT NULL,
    "taxId" UUID NOT NULL,
    "rate" DECIMAL(6,3) NOT NULL,
    "base" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "invoice_line_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "methodId" UUID,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "receivedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL DEFAULT 'CASH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "jobCardId" UUID,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "expenseDate" DATE NOT NULL,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "ownerType" TEXT,
    "ownerId" UUID,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "authorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_fieldsets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_fieldsets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_definitions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branchId" UUID,
    "fieldsetId" UUID,
    "entityType" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "optionsJson" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "showOnPdf" BOOLEAN NOT NULL DEFAULT false,
    "showOnPortal" BOOLEAN NOT NULL DEFAULT false,
    "clientEditable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "fieldId" UUID NOT NULL,
    "value" TEXT,
    "valueJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "actorId" UUID,
    "entityType" TEXT NOT NULL,
    "entityId" UUID,
    "action" TEXT NOT NULL,
    "diffJson" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "number_sequences" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "prefix" TEXT,
    "padding" INTEGER NOT NULL DEFAULT 6,
    "nextValue" INTEGER NOT NULL DEFAULT 1,
    "format" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "branches_tenant_id_idx" ON "branches"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "branches_tenant_id_code_key" ON "branches"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "memberships_tenant_id_idx" ON "memberships"("tenant_id");

-- CreateIndex
CREATE INDEX "memberships_userId_idx" ON "memberships"("userId");

-- CreateIndex
CREATE INDEX "memberships_branchId_idx" ON "memberships"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_tenant_id_userId_key" ON "memberships"("tenant_id", "userId");

-- CreateIndex
CREATE INDEX "roles_tenant_id_idx" ON "roles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_slug_key" ON "roles"("tenant_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "customers_tenant_id_idx" ON "customers"("tenant_id");

-- CreateIndex
CREATE INDEX "customers_tenant_id_name_idx" ON "customers"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "vehicle_brands_tenant_id_idx" ON "vehicle_brands"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_brands_tenant_id_name_key" ON "vehicle_brands"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "vehicle_models_tenant_id_idx" ON "vehicle_models"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_brandId_name_key" ON "vehicle_models"("brandId", "name");

-- CreateIndex
CREATE INDEX "vehicle_types_tenant_id_idx" ON "vehicle_types"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_types_tenant_id_name_key" ON "vehicle_types"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "vehicle_colors_tenant_id_idx" ON "vehicle_colors"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_colors_tenant_id_name_key" ON "vehicle_colors"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "vehicle_fuel_types_tenant_id_idx" ON "vehicle_fuel_types"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_fuel_types_tenant_id_name_key" ON "vehicle_fuel_types"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_idx" ON "vehicles"("tenant_id");

-- CreateIndex
CREATE INDEX "vehicles_customerId_idx" ON "vehicles"("customerId");

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_plate_idx" ON "vehicles"("tenant_id", "plate");

-- CreateIndex
CREATE INDEX "vehicle_history_tenant_id_idx" ON "vehicle_history"("tenant_id");

-- CreateIndex
CREATE INDEX "vehicle_history_vehicleId_idx" ON "vehicle_history"("vehicleId");

-- CreateIndex
CREATE INDEX "product_categories_tenant_id_idx" ON "product_categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_tenant_id_name_key" ON "product_categories"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "units_tenant_id_idx" ON "units"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "units_tenant_id_name_key" ON "units"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "taxes_tenant_id_idx" ON "taxes"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "taxes_tenant_id_name_key" ON "taxes"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "service_catalogs_tenant_id_idx" ON "service_catalogs"("tenant_id");

-- CreateIndex
CREATE INDEX "service_catalogs_tenant_id_name_idx" ON "service_catalogs"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "part_catalogs_tenant_id_idx" ON "part_catalogs"("tenant_id");

-- CreateIndex
CREATE INDEX "part_catalogs_tenant_id_sku_idx" ON "part_catalogs"("tenant_id", "sku");

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_idx" ON "suppliers"("tenant_id");

-- CreateIndex
CREATE INDEX "service_parts_tenant_id_idx" ON "service_parts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_parts_serviceId_partId_key" ON "service_parts"("serviceId", "partId");

-- CreateIndex
CREATE INDEX "stock_locations_tenant_id_idx" ON "stock_locations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_locations_branchId_name_key" ON "stock_locations"("branchId", "name");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_idx" ON "stock_movements"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_movements_partId_idx" ON "stock_movements"("partId");

-- CreateIndex
CREATE INDEX "stock_movements_locationId_idx" ON "stock_movements"("locationId");

-- CreateIndex
CREATE INDEX "stock_movements_refType_refId_idx" ON "stock_movements"("refType", "refId");

-- CreateIndex
CREATE INDEX "stock_balances_tenant_id_idx" ON "stock_balances"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_balances_locationId_partId_key" ON "stock_balances"("locationId", "partId");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_idx" ON "appointments"("tenant_id");

-- CreateIndex
CREATE INDEX "appointments_branchId_scheduledStart_idx" ON "appointments"("branchId", "scheduledStart");

-- CreateIndex
CREATE INDEX "business_hours_tenant_id_idx" ON "business_hours"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_hours_branchId_dayOfWeek_key" ON "business_hours"("branchId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "holidays_tenant_id_idx" ON "holidays"("tenant_id");

-- CreateIndex
CREATE INDEX "holidays_branchId_idx" ON "holidays"("branchId");

-- CreateIndex
CREATE INDEX "inspection_templates_tenant_id_idx" ON "inspection_templates"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_template_versions_templateId_version_key" ON "inspection_template_versions"("templateId", "version");

-- CreateIndex
CREATE INDEX "inspection_sections_versionId_idx" ON "inspection_sections"("versionId");

-- CreateIndex
CREATE INDEX "inspection_questions_sectionId_idx" ON "inspection_questions"("sectionId");

-- CreateIndex
CREATE INDEX "inspection_question_options_questionId_idx" ON "inspection_question_options"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "inspections_jobCardId_key" ON "inspections"("jobCardId");

-- CreateIndex
CREATE INDEX "inspections_tenant_id_idx" ON "inspections"("tenant_id");

-- CreateIndex
CREATE INDEX "inspections_vehicleId_idx" ON "inspections"("vehicleId");

-- CreateIndex
CREATE INDEX "inspection_answers_inspectionId_idx" ON "inspection_answers"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_answers_inspectionId_questionId_key" ON "inspection_answers"("inspectionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_answer_attachments_answerId_attachmentId_key" ON "inspection_answer_attachments"("answerId", "attachmentId");

-- CreateIndex
CREATE INDEX "job_cards_tenant_id_idx" ON "job_cards"("tenant_id");

-- CreateIndex
CREATE INDEX "job_cards_branchId_status_idx" ON "job_cards"("branchId", "status");

-- CreateIndex
CREATE INDEX "job_cards_customerId_idx" ON "job_cards"("customerId");

-- CreateIndex
CREATE INDEX "job_cards_vehicleId_idx" ON "job_cards"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "job_cards_tenant_id_number_key" ON "job_cards"("tenant_id", "number");

-- CreateIndex
CREATE INDEX "job_status_history_jobCardId_idx" ON "job_status_history"("jobCardId");

-- CreateIndex
CREATE UNIQUE INDEX "job_mechanics_jobCardId_userId_key" ON "job_mechanics"("jobCardId", "userId");

-- CreateIndex
CREATE INDEX "job_checklist_items_jobCardId_idx" ON "job_checklist_items"("jobCardId");

-- CreateIndex
CREATE INDEX "job_lines_jobCardId_idx" ON "job_lines"("jobCardId");

-- CreateIndex
CREATE INDEX "job_line_taxes_lineId_idx" ON "job_line_taxes"("lineId");

-- CreateIndex
CREATE INDEX "quotations_tenant_id_idx" ON "quotations"("tenant_id");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_tenant_id_number_key" ON "quotations"("tenant_id", "number");

-- CreateIndex
CREATE INDEX "quotation_lines_quotationId_idx" ON "quotation_lines"("quotationId");

-- CreateIndex
CREATE INDEX "quotation_line_taxes_lineId_idx" ON "quotation_line_taxes"("lineId");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_idx" ON "invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_number_key" ON "invoices"("tenant_id", "number");

-- CreateIndex
CREATE INDEX "invoice_lines_invoiceId_idx" ON "invoice_lines"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_line_taxes_lineId_idx" ON "invoice_line_taxes"("lineId");

-- CreateIndex
CREATE INDEX "payments_tenant_id_idx" ON "payments"("tenant_id");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payment_methods_tenant_id_idx" ON "payment_methods"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_tenant_id_name_key" ON "payment_methods"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "expenses_tenant_id_idx" ON "expenses"("tenant_id");

-- CreateIndex
CREATE INDEX "expenses_branchId_expenseDate_idx" ON "expenses"("branchId", "expenseDate");

-- CreateIndex
CREATE INDEX "attachments_tenant_id_idx" ON "attachments"("tenant_id");

-- CreateIndex
CREATE INDEX "attachments_ownerType_ownerId_idx" ON "attachments"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "notes_tenant_id_idx" ON "notes"("tenant_id");

-- CreateIndex
CREATE INDEX "notes_entityType_entityId_idx" ON "notes"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "custom_fieldsets_tenant_id_idx" ON "custom_fieldsets"("tenant_id");

-- CreateIndex
CREATE INDEX "custom_field_definitions_tenant_id_idx" ON "custom_field_definitions"("tenant_id");

-- CreateIndex
CREATE INDEX "custom_field_definitions_entityType_idx" ON "custom_field_definitions"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definitions_tenant_id_entityType_code_key" ON "custom_field_definitions"("tenant_id", "entityType", "code");

-- CreateIndex
CREATE INDEX "custom_field_values_tenant_id_idx" ON "custom_field_values"("tenant_id");

-- CreateIndex
CREATE INDEX "custom_field_values_entityType_entityId_idx" ON "custom_field_values"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_values_entityType_entityId_fieldId_key" ON "custom_field_values"("entityType", "entityId", "fieldId");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_tenant_id_entity_key" ON "number_sequences"("tenant_id", "entity");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "vehicle_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "vehicle_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "vehicle_fuel_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "vehicle_colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_history" ADD CONSTRAINT "vehicle_history_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_history" ADD CONSTRAINT "vehicle_history_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_catalogs" ADD CONSTRAINT "service_catalogs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_catalogs" ADD CONSTRAINT "part_catalogs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_catalogs" ADD CONSTRAINT "part_catalogs_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_parts" ADD CONSTRAINT "service_parts_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_parts" ADD CONSTRAINT "service_parts_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part_catalogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part_catalogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part_catalogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_template_versions" ADD CONSTRAINT "inspection_template_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "inspection_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_sections" ADD CONSTRAINT "inspection_sections_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "inspection_template_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_questions" ADD CONSTRAINT "inspection_questions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "inspection_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_questions" ADD CONSTRAINT "inspection_questions_conditionalParentId_fkey" FOREIGN KEY ("conditionalParentId") REFERENCES "inspection_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_question_options" ADD CONSTRAINT "inspection_question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "inspection_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "inspection_template_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_answers" ADD CONSTRAINT "inspection_answers_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_answers" ADD CONSTRAINT "inspection_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "inspection_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_answer_attachments" ADD CONSTRAINT "inspection_answer_attachments_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "inspection_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_answer_attachments" ADD CONSTRAINT "inspection_answer_attachments_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_mechanics" ADD CONSTRAINT "job_mechanics_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_mechanics" ADD CONSTRAINT "job_mechanics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_checklist_items" ADD CONSTRAINT "job_checklist_items_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_lines" ADD CONSTRAINT "job_lines_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_lines" ADD CONSTRAINT "job_lines_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_lines" ADD CONSTRAINT "job_lines_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_lines" ADD CONSTRAINT "job_lines_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_line_taxes" ADD CONSTRAINT "job_line_taxes_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "job_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_line_taxes" ADD CONSTRAINT "job_line_taxes_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_line_taxes" ADD CONSTRAINT "quotation_line_taxes_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "quotation_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_line_taxes" ADD CONSTRAINT "quotation_line_taxes_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_quotationLineId_fkey" FOREIGN KEY ("quotationLineId") REFERENCES "quotation_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_jobLineId_fkey" FOREIGN KEY ("jobLineId") REFERENCES "job_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_taxes" ADD CONSTRAINT "invoice_line_taxes_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "invoice_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_taxes" ADD CONSTRAINT "invoice_line_taxes_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_fieldsetId_fkey" FOREIGN KEY ("fieldsetId") REFERENCES "custom_fieldsets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "custom_field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

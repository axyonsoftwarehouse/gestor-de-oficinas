-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('RECEIVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "purchases" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "supplierId" UUID,
    "number" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'RECEIVED',
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" UUID NOT NULL,
    "purchaseId" UUID NOT NULL,
    "partId" UUID NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unitCost" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchases_tenant_id_idx" ON "purchases"("tenant_id");

-- CreateIndex
CREATE INDEX "purchases_supplierId_idx" ON "purchases"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_tenant_id_number_key" ON "purchases"("tenant_id", "number");

-- CreateIndex
CREATE INDEX "purchase_items_purchaseId_idx" ON "purchase_items"("purchaseId");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part_catalogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN "purchase_id" UUID;

-- AlterTable
ALTER TABLE "purchase_items" ADD COLUMN "previous_cost" DECIMAL(14,2);

-- CreateIndex
CREATE UNIQUE INDEX "expenses_purchase_id_key" ON "expenses"("purchase_id");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

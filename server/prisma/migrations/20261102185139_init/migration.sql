-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ESTIMATOR', 'SALES_HEAD');

-- CreateEnum
CREATE TYPE "RFQStatus" AS ENUM ('ESTIMATING', 'SENT', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'READY_TO_SEND', 'SENT');

-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('MATERIAL', 'MACHINE_HOUR', 'OVERHEAD', 'PACKING', 'FREIGHT', 'GST');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AIExtractionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'VERIFIED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfqs" (
    "id" TEXT NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerType" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "status" "RFQStatus" NOT NULL DEFAULT 'ESTIMATING',
    "lostReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "partNumber" TEXT,
    "partName" TEXT NOT NULL,
    "material" TEXT,
    "grossWeightKg" DECIMAL(10,4),
    "netWeightKg" DECIMAL(10,4),
    "scrapPercentage" DECIMAL(5,2),
    "annualVolume" INTEGER,
    "setupHours" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_operations" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "operationSequence" INTEGER NOT NULL,
    "operationName" TEXT NOT NULL,
    "machineType" TEXT NOT NULL,
    "cycleTimeMinutes" DECIMAL(8,2) NOT NULL,
    "machineHourRate" DECIMAL(10,2) NOT NULL,
    "machineRateVersionId" TEXT,
    "setupHours" DECIMAL(8,2),

    CONSTRAINT "part_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_masters" (
    "id" TEXT NOT NULL,
    "rateType" "RateType" NOT NULL,
    "rateName" TEXT NOT NULL,
    "materialGrade" TEXT,
    "machineType" TEXT,
    "rateValue" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "versionNumber" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotalBeforeTax" DECIMAL(14,2),
    "annualContractValue" DECIMAL(14,2),
    "marginPercentage" DECIMAL(5,2),
    "gstPercentage" DECIMAL(5,2),
    "gstAmount" DECIMAL(14,2),
    "totalIncludingGST" DECIMAL(14,2),
    "rateSnapshot" JSONB,
    "calculationSnapshot" JSONB,
    "calculationVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_parts" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quotedAnnualVolume" INTEGER NOT NULL,
    "materialCost" DECIMAL(12,4) NOT NULL,
    "conversionCost" DECIMAL(12,4) NOT NULL,
    "setupCost" DECIMAL(12,4) NOT NULL,
    "overheadCost" DECIMAL(12,4) NOT NULL,
    "packingCost" DECIMAL(12,4) NOT NULL,
    "freightCost" DECIMAL(12,4) NOT NULL,
    "totalCostPerUnit" DECIMAL(12,4) NOT NULL,
    "marginPercentage" DECIMAL(5,2) NOT NULL,
    "sellingPriceBeforeGST" DECIMAL(12,4) NOT NULL,
    "gstAmountPerUnit" DECIMAL(12,4) NOT NULL,
    "sellingPriceIncludingGST" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "quotation_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_tiers" (
    "id" TEXT NOT NULL,
    "quotationPartId" TEXT NOT NULL,
    "annualVolume" INTEGER NOT NULL,
    "materialCost" DECIMAL(12,4) NOT NULL,
    "conversionCost" DECIMAL(12,4) NOT NULL,
    "setupCost" DECIMAL(12,4) NOT NULL,
    "overheadCost" DECIMAL(12,4) NOT NULL,
    "packingCost" DECIMAL(12,4) NOT NULL,
    "freightCost" DECIMAL(12,4) NOT NULL,
    "totalCostPerUnit" DECIMAL(12,4) NOT NULL,
    "sellingPriceBeforeGST" DECIMAL(12,4) NOT NULL,
    "gstAmount" DECIMAL(12,4) NOT NULL,
    "sellingPriceIncludingGST" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "quotation_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_rate_snapshots" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "rateMasterId" TEXT NOT NULL,
    "rateType" "RateType" NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "rateValue" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "quotation_rate_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "actionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_extractions" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "extractedData" JSONB,
    "confidenceData" JSONB,
    "sourceData" JSONB,
    "status" "AIExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_suggestions" (
    "id" TEXT NOT NULL,
    "targetPartId" TEXT NOT NULL,
    "sourcePartId" TEXT NOT NULL,
    "similarityScore" DECIMAL(5,4) NOT NULL,
    "suggestionData" JSONB,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routing_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_tokenHash_idx" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "rfqs_rfqNumber_key" ON "rfqs"("rfqNumber");

-- CreateIndex
CREATE INDEX "rfqs_rfqNumber_idx" ON "rfqs"("rfqNumber");

-- CreateIndex
CREATE INDEX "rfqs_customerName_idx" ON "rfqs"("customerName");

-- CreateIndex
CREATE INDEX "rfqs_status_idx" ON "rfqs"("status");

-- CreateIndex
CREATE INDEX "rfqs_dueDate_idx" ON "rfqs"("dueDate");

-- CreateIndex
CREATE INDEX "rfqs_ownerId_idx" ON "rfqs"("ownerId");

-- CreateIndex
CREATE INDEX "parts_rfqId_idx" ON "parts"("rfqId");

-- CreateIndex
CREATE INDEX "parts_partName_idx" ON "parts"("partName");

-- CreateIndex
CREATE INDEX "parts_material_idx" ON "parts"("material");

-- CreateIndex
CREATE INDEX "part_operations_partId_idx" ON "part_operations"("partId");

-- CreateIndex
CREATE INDEX "rate_masters_rateType_effectiveFrom_idx" ON "rate_masters"("rateType", "effectiveFrom");

-- CreateIndex
CREATE INDEX "rate_masters_rateName_rateType_idx" ON "rate_masters"("rateName", "rateType");

-- CreateIndex
CREATE INDEX "rate_masters_isActive_idx" ON "rate_masters"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotationNumber_key" ON "quotations"("quotationNumber");

-- CreateIndex
CREATE INDEX "quotations_quotationNumber_idx" ON "quotations"("quotationNumber");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotations_rfqId_idx" ON "quotations"("rfqId");

-- CreateIndex
CREATE INDEX "quotations_createdBy_idx" ON "quotations"("createdBy");

-- CreateIndex
CREATE INDEX "quotation_parts_quotationId_idx" ON "quotation_parts"("quotationId");

-- CreateIndex
CREATE INDEX "quotation_parts_partId_idx" ON "quotation_parts"("partId");

-- CreateIndex
CREATE INDEX "quotation_tiers_quotationPartId_idx" ON "quotation_tiers"("quotationPartId");

-- CreateIndex
CREATE INDEX "quotation_rate_snapshots_quotationId_idx" ON "quotation_rate_snapshots"("quotationId");

-- CreateIndex
CREATE INDEX "approvals_quotationId_idx" ON "approvals"("quotationId");

-- CreateIndex
CREATE INDEX "approvals_approverId_idx" ON "approvals"("approverId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "ai_extractions_rfqId_idx" ON "ai_extractions"("rfqId");

-- CreateIndex
CREATE INDEX "ai_extractions_inputHash_idx" ON "ai_extractions"("inputHash");

-- CreateIndex
CREATE INDEX "routing_suggestions_targetPartId_idx" ON "routing_suggestions"("targetPartId");

-- CreateIndex
CREATE INDEX "routing_suggestions_sourcePartId_idx" ON "routing_suggestions"("sourcePartId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parts" ADD CONSTRAINT "parts_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_operations" ADD CONSTRAINT "part_operations_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_operations" ADD CONSTRAINT "part_operations_machineRateVersionId_fkey" FOREIGN KEY ("machineRateVersionId") REFERENCES "rate_masters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_masters" ADD CONSTRAINT "rate_masters_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_parts" ADD CONSTRAINT "quotation_parts_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_parts" ADD CONSTRAINT "quotation_parts_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_tiers" ADD CONSTRAINT "quotation_tiers_quotationPartId_fkey" FOREIGN KEY ("quotationPartId") REFERENCES "quotation_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_rate_snapshots" ADD CONSTRAINT "quotation_rate_snapshots_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_rate_snapshots" ADD CONSTRAINT "quotation_rate_snapshots_rateMasterId_fkey" FOREIGN KEY ("rateMasterId") REFERENCES "rate_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_extractions" ADD CONSTRAINT "ai_extractions_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_suggestions" ADD CONSTRAINT "routing_suggestions_targetPartId_fkey" FOREIGN KEY ("targetPartId") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_suggestions" ADD CONSTRAINT "routing_suggestions_sourcePartId_fkey" FOREIGN KEY ("sourcePartId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

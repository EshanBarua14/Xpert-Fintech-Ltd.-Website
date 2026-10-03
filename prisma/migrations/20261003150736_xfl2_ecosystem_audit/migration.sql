-- CreateEnum
CREATE TYPE "EcosystemLayer" AS ENUM ('MARKET', 'XFL', 'PRODUCT', 'INSTITUTION', 'USER');

-- CreateEnum
CREATE TYPE "EcosystemEdgeKind" AS ENUM ('DATA', 'ORDER', 'ONBOARDING', 'RISK', 'OPERATIONS');

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "isPlaceholder" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EcosystemNode" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "layer" "EcosystemLayer" NOT NULL,
    "offeringId" TEXT,
    "organizationId" TEXT,
    "iconName" TEXT,
    "layoutX" DOUBLE PRECISION,
    "layoutY" DOUBLE PRECISION,
    "mobileOrder" INTEGER NOT NULL DEFAULT 0,
    "editorNote" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EcosystemNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemNodeTranslation" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "ctaLabel" TEXT,

    CONSTRAINT "EcosystemNodeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemEdge" (
    "id" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "kind" "EcosystemEdgeKind" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EcosystemEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemFlow" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "isPlayback" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EcosystemFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemFlowTranslation" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "EcosystemFlowTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemFlowStep" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "edgeId" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "EcosystemFlowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemFlowStepTranslation" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,

    CONSTRAINT "EcosystemFlowStepTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" "EntityType",
    "entityId" TEXT,
    "changes" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EcosystemNode_key_key" ON "EcosystemNode"("key");

-- CreateIndex
CREATE UNIQUE INDEX "EcosystemNodeTranslation_nodeId_locale_key" ON "EcosystemNodeTranslation"("nodeId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "EcosystemEdge_fromNodeId_toNodeId_kind_key" ON "EcosystemEdge"("fromNodeId", "toNodeId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "EcosystemFlow_key_key" ON "EcosystemFlow"("key");

-- CreateIndex
CREATE UNIQUE INDEX "EcosystemFlowTranslation_flowId_locale_key" ON "EcosystemFlowTranslation"("flowId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "EcosystemFlowStepTranslation_stepId_locale_key" ON "EcosystemFlowStepTranslation"("stepId", "locale");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "EcosystemNodeTranslation" ADD CONSTRAINT "EcosystemNodeTranslation_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "EcosystemNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcosystemEdge" ADD CONSTRAINT "EcosystemEdge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "EcosystemNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcosystemEdge" ADD CONSTRAINT "EcosystemEdge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "EcosystemNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcosystemFlowTranslation" ADD CONSTRAINT "EcosystemFlowTranslation_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "EcosystemFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcosystemFlowStep" ADD CONSTRAINT "EcosystemFlowStep_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "EcosystemFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcosystemFlowStep" ADD CONSTRAINT "EcosystemFlowStep_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "EcosystemNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcosystemFlowStep" ADD CONSTRAINT "EcosystemFlowStep_edgeId_fkey" FOREIGN KEY ("edgeId") REFERENCES "EcosystemEdge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcosystemFlowStepTranslation" ADD CONSTRAINT "EcosystemFlowStepTranslation_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "EcosystemFlowStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

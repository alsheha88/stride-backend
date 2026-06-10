/*
  Warnings:

  - You are about to drop the column `notes` on the `Concept` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Concept" DROP COLUMN "notes";

-- CreateTable
CREATE TABLE "ConceptNote" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conceptId" UUID NOT NULL,

    CONSTRAINT "ConceptNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConceptNote_conceptId_idx" ON "ConceptNote"("conceptId");

-- AddForeignKey
ALTER TABLE "ConceptNote" ADD CONSTRAINT "ConceptNote_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

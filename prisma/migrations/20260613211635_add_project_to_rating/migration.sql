-- AlterTable
ALTER TABLE "ConceptRating" ADD COLUMN     "projectId" UUID;

-- AddForeignKey
ALTER TABLE "ConceptRating" ADD CONSTRAINT "ConceptRating_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

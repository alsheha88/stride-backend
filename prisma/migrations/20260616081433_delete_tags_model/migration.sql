/*
  Warnings:

  - You are about to drop the `ConceptTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ConceptTag" DROP CONSTRAINT "ConceptTag_conceptId_fkey";

-- DropForeignKey
ALTER TABLE "ConceptTag" DROP CONSTRAINT "ConceptTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_userId_fkey";

-- DropTable
DROP TABLE "ConceptTag";

-- DropTable
DROP TABLE "Tag";

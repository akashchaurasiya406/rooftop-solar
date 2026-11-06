-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "aiIssues" JSONB,
ADD COLUMN     "aiModel" TEXT,
ADD COLUMN     "billAmount" INTEGER,
ADD COLUMN     "fileData" BYTEA,
ADD COLUMN     "fileMime" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "reuploadReason" TEXT,
ALTER COLUMN "imagePath" DROP NOT NULL;

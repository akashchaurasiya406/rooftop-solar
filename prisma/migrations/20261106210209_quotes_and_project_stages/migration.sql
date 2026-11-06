-- AlterEnum
BEGIN;
CREATE TYPE "ProjectStage_new" AS ENUM ('ADVANCE_PAID', 'MATERIALS_DISPATCHED', 'INSTALLED', 'NET_METER_APPLIED', 'NET_METER_INSTALLED', 'SUBSIDY_APPLIED', 'SUBSIDY_CREDITED');
ALTER TABLE "public"."Project" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "Project" ALTER COLUMN "stage" TYPE "ProjectStage_new" USING ("stage"::text::"ProjectStage_new");
ALTER TABLE "ProjectEvent" ALTER COLUMN "stage" TYPE "ProjectStage_new" USING ("stage"::text::"ProjectStage_new");
ALTER TYPE "ProjectStage" RENAME TO "ProjectStage_old";
ALTER TYPE "ProjectStage_new" RENAME TO "ProjectStage";
DROP TYPE "public"."ProjectStage_old";
ALTER TABLE "Project" ALTER COLUMN "stage" SET DEFAULT 'ADVANCE_PAID';
COMMIT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "advanceAmount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "options" JSONB NOT NULL,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "validUntil" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "paybackYears" DROP NOT NULL;


/*
  Warnings:

  - A unique constraint covering the columns `[projectId,index]` on the table `ProjectField` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,label]` on the table `ProjectField` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ProjectField" ADD COLUMN "index" INTEGER;

select label as c from "ProjectField" group by label having count('projectId') > 1 order by count("projectId") desc;
select label, count("projectId") as c from "ProjectField" group by label order by count("projectId") desc;

-- Make sure all project fields have unique names within their project
-- NOTE: if we don't do this, the following creation of unique indexes wont work
UPDATE "ProjectField"
  SET label = (label||' '||id::text)
WHERE label IN (
  SELECT label FROM "ProjectField" GROUP BY label HAVING COUNT('projectId') > 1);

UPDATE "ProjectField" SET index = id;

-- update new nullable index column (before making it not nullable)
do
$$
declare
    f record;
begin
    for f in (select id, "projectId", label, ROW_NUMBER() OVER (PARTITION BY "projectId" ORDER BY "createdAt") as index from "ProjectField") loop
      UPDATE "ProjectField" SET index = f.index WHERE id = f.id;
    end loop;
end;
$$;

ALTER TABLE "ProjectField" ALTER COLUMN "index" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectField_projectId_index_key" ON "ProjectField"("projectId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectField_projectId_label_key" ON "ProjectField"("projectId", "label");
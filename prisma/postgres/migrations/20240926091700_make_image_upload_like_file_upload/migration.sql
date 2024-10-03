-- Remove imageId constraint and index
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_imageId_fkey";
DROP INDEX "Observation_imageId_key";

-- add nullable observationId to ImageUpload
ALTER TABLE "ImageUpload" ADD COLUMN     "observationId" INTEGER;

-- select o.id as "o.id", o."imageId" as "o.imageId", i.id as "i.id", i."observationId" as "i.observationId" from "Observation" o inner join "ImageUpload" i on o."imageId" = i.id;

-- create imageId observationId view
create view remove_this as select id as "observationId","imageId" from "Observation" where "imageId" is not null;

-- set ImageUpload.observationId to related observation id via observation.imageId
update "ImageUpload" b set "observationId" = a."observationId" from remove_this a where a."imageId" = b.id;

-- drop the view again
drop view remove_this;

-- show situation (debug purpose):
-- select o.id as "o.id", o."imageId" as "o.imageId", i.id as "i.id", i."observationId" as "i.observationId" from "Observation" o inner join "ImageUpload" i on o."imageId" = i.id;

-- delete unreferenced image uploads
delete from "ImageUpload" where "id" not in (select "imageId" from "Observation" where "imageId" is not null);

-- make ImageUpload.observationId not nullable !
ALTER TABLE "ImageUpload" ALTER COLUMN "observationId" SET NOT NULL;

-- remove deprecated Observation.imageId
ALTER TABLE "Observation" DROP COLUMN "imageId";

-- create index and foreign keys for ImageUpload.observationId
CREATE UNIQUE INDEX "ImageUpload_observationId_key" ON "ImageUpload"("observationId");
ALTER TABLE "ImageUpload" ADD CONSTRAINT "ImageUpload_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

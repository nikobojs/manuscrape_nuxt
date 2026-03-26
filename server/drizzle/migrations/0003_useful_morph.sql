-- add image types to field types
ALTER TYPE "public"."field_type" ADD VALUE 'IMAGE_SINGLE';
ALTER TYPE "public"."field_type" ADD VALUE 'IMAGE_MULTIPLE';

-- add non referencing nullable project_field_ids to all images
ALTER TABLE "ImageUpload" ADD COLUMN "project_field_id" integer;--> statement-breakpoint

-- insert image parameter into every project
WITH max_indexes AS (
    SELECT project_id, MAX(index) as max_idx
    FROM "ProjectField"
    GROUP BY project_id
)
INSERT INTO "ProjectField" (project_id, index, label, required, type)
SELECT
    p.id,
    COALESCE(mi.max_idx, 0) + 1,
    'Image',
    true,
    'IMAGE_SINGLE'
FROM "Project" p
LEFT JOIN max_indexes mi ON mi.project_id = p.id
RETURNING id;

-- add newly created parameters to all project fields
UPDATE "ImageUpload" iu
SET project_field_id = pf.id
FROM "Observation" o
INNER JOIN "ProjectField" pf ON pf.project_id = o.project_id
WHERE iu.observation_id = o.id
AND pf.type = 'IMAGE_SINGLE';

-- make image upload project field required
ALTER TABLE "ImageUpload" ALTER COLUMN "project_field_id" SET NOT NULL;

-- add foreign key constraint to image upload project field
ALTER TABLE "ImageUpload" ADD CONSTRAINT "ImageUpload_project_field_id_ProjectField_id_fk" FOREIGN KEY ("project_field_id") REFERENCES "public"."ProjectField"("id") ON DELETE cascade ON UPDATE no action;

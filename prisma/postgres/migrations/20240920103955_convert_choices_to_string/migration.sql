-- AlterTable

-- generate and save new multiple choice project field values in variable
select id,array_to_string(choices,'_%%%%%%_') as "choices" into hello
from "ProjectField"
  where type in ('AUTOCOMPLETE','CHOICE','AUTOCOMPLETE_ADD','MULTIPLE_CHOICE_ADD');

-- set project field data type to text
ALTER TABLE "ProjectField" ALTER COLUMN "choices" SET DATA TYPE TEXT;

-- update ProjectField choices with hello data
update "ProjectField" p
set choices = h.choices
from hello h
where p.id = h.id;

-- drop hello
drop table hello;

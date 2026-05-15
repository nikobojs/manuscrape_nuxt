import excel from "exceljs";
import { calculateDynamicFieldValue } from "../dynamicFields";
import { captureException } from "@sentry/node";
import type { H3Event } from "h3";
import { canUseS3 } from "../fileUpload";
import { generateFilename } from "./helpers";
import { desc, SQL } from "drizzle-orm";
import { observations } from "~~/server/drizzle/schema";
import { getCollaboratorsInProjects } from "../collaborators";

function generateObservationRow(
  obs: FullObservation,
  fields: SmallProjectField[],
  dynamicFields: FullDynamicProjectField[],
  contributors: { nameInProject: string; user_id: number }[],
  allTags: string[],
  includeTags: boolean,
) {
  // get list of field labels (which are also data-keys)
  const fieldLabels = fields.map((f) => f.label);

  // initialize empty field value array in the same length as number of fields
  const fieldValues = new Array(fields.length + dynamicFields.length);

  // for each data entry
  const entries = Object.entries(obs.data!);
  for (let i = 0; i < entries.length; i++) {
    const [key, rawVal] = entries[i]!;

    // get column index with that label
    const columnIndex = fieldLabels.indexOf(key);

    // if label doesn't exist, it must be from some older fields that wasn't deleted correctly
    if (columnIndex === -1) {
      const errMsg = `Label '${key}' does not exist when generating nvivo export, obsId ${obs.id}`;
      if (process.env.VITEST !== "true") {
        console.error(errMsg);
      }
      captureException(errMsg);
      return;
    }

    // initialize default cell value
    let val = rawVal;

    // replace carriage returns to support line feeds in windows excel
    if (typeof val === "string") {
      val = val.replaceAll("\n", "\r\n");
    }

    // set column value on the found column index
    fieldValues[columnIndex] = val;
  }

  // calculate and add the dynamic values to the row
  const dynamicFieldsIndexOffset = fieldValues.length - dynamicFields.length;
  for (let i = 0; i < dynamicFields.length; i++) {
    const val = calculateDynamicFieldValue(dynamicFields[i]!, fields, obs);
    const columnIndex = i + dynamicFieldsIndexOffset;
    fieldValues[columnIndex] = val;
  }

  // get name / initials / alias for author of observation
  const { nameInProject } = contributors.find(
    (a) => a.user_id === obs.user?.id,
  ) || {
    nameInProject: "<deleted user>",
  };

  let tagFlags: boolean[] = [];
  if (includeTags) {
    const tagSet = new Set(obs.tags.map((t: { name: string }) => t.name));
    tagFlags = allTags.map((tag) => (tagSet.has(tag) ? true : false));
  }

  // define values in this observation row
  const row = [
    obs.id,
    obs.createdAt,
    obs.updatedAt,
    nameInProject,
    ...fieldValues,
    ...tagFlags,
  ];

  // return the row
  return row;
}

function getWorksheetColumns(
  fields: SmallProjectField[],
  dynamicFields: FullDynamicProjectField[],
  allTags: string[] = [],
): Partial<excel.Column>[] {
  const predefinedColumns = [
    {
      id: 0,
      header: "Observation Id",
      width: 14,
    },
    {
      id: 1,
      header: "Created At",
      width: 14,
    },
    {
      id: 2,
      header: "Last update",
      width: 14,
    },
    {
      id: 4,
      header: "Submitted by",
      width: 18,
    },
  ];

  const dataColumns: Partial<excel.Column>[] = fields.map((field, index) => {
    return {
      header: field.label,
      width: calculateTextWidth(field.label),
      id: index + predefinedColumns.length,
    };
  });

  const dynamicColumns: Partial<excel.Column>[] = dynamicFields.map(
    (field, index) => {
      return {
        header: field.label,
        width: calculateTextWidth(field.label),
        id: index + predefinedColumns.length + dataColumns.length,
      };
    },
  );

  const tagColumns: Partial<excel.Column>[] = allTags.map((tag, i) => ({
    header: tag,
    width: Math.max(10, tag.length + 2),
    id: i + 1000, // just make sure there's no conflict
  }));

  return [
    ...predefinedColumns,
    ...dataColumns,
    ...dynamicColumns,
    ...tagColumns,
  ];
}

// NOTE: this is a very random thing to do. Should be replaced
// Takes a string and returns it's approximate column width (in excel terms)
function calculateTextWidth(label: string): number {
  let thins = 0;
  let bigs = 0;
  const thinLetters = "iljI1.,'! ".split("");
  const wideLetters = "mwMNOUVWXZÆØ".split("");
  const labelSplit = label.split("");

  thinLetters.forEach((c) => {
    thins += labelSplit.filter((_c) => _c === c).length;
  });
  wideLetters.forEach((c) => {
    bigs += labelSplit.filter((_c) => _c === c).length;
  });

  const otherLetters = label.length - thins - bigs;
  const length = thins * 0.6 + bigs * 1.3 + otherLetters * 1 + 1;
  return Math.max(length, 16);
}

export const generateNvivoExport = async (
  _event: H3Event,
  projectId: number,
  observationFilter: SQL<unknown>,
  includeTags: boolean,
) => {
  // get project by projectId
  const [project] = await getSmallProjects([projectId]);

  // ensure project exists
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: "Project does not exist",
    });
  }

  // fetch related observations
  const obs = await getFullObservationsByProjectId(
    observationFilter,
    desc(observations.id),
    0,
    100000,
  ); // max a hundred thousand rows

  // initialize a few shortcut variables
  const fields: SmallProjectField[] = project.fields;
  const dynamicFields: FullDynamicProjectField[] = project.dynamicFields;

  // ensure export is meaningful
  if (obs.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "There are no published observations on this project",
    });
  }

  // add tag headers if enabled
  let allTags: string[] = [];
  if (includeTags) {
    allTags = Array.from(
      new Set(obs.flatMap((o) => o.tags.map((t) => t.name))),
    );
  }

  // create workbook and set some metadata
  const wb = new excel.Workbook();
  wb.created = new Date();
  wb.modified = new Date();

  // create our first (and only?) sheet
  const sheet = wb.addWorksheet("Observations");

  // set the columns (adds column widths and column header cells)
  sheet.columns = getWorksheetColumns(fields, dynamicFields, allTags);

  // create all our observation rows for this project
  const observationRows = [];
  const contributors = await getCollaboratorsInProjects([project.id]);
  for (const o of obs) {
    try {
      const row = generateObservationRow(
        o,
        fields,
        dynamicFields,
        contributors,
        allTags,
        includeTags,
      );
      observationRows.push(row);
    } catch (e) {
      console.error(
        "Error when generating observation row. Will skip this observation",
      );
      console.error(e);
      captureException(e);
    }
  }

  // TODO: check if there are more than 0 observationRows

  // add the observation rows to the sheet
  sheet.addRows(observationRows);

  // write a buffer to ram
  const buffer = await wb.xlsx.writeBuffer();

  // upload excel file to s3
  const newPath = generateFilename(projectId, "NVIVO");
  await uploadFile(newPath, Buffer.from(buffer), canUseS3());

  const mimetype =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return {
    filePath: newPath,
    isS3: canUseS3(),
    mimetype,
    observationsCount: obs.length,
    size: buffer.byteLength,
  };
};

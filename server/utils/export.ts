import excel from 'exceljs';
import { exportProjectQuery } from './prisma';
import type { H3Event } from 'h3';


export async function generateNvivoExport(projectId: number, event: H3Event) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: exportProjectQuery,
  });
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project does not exist'
    });
  }

  const observations = project.observations;
  const mappedObservations = observations.map((o) => {
    return {
      id: o.id,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      imageId: o.image?.id || '',
      data: o.data,
    }
  });

  const wb = new excel.Workbook();
  wb.created = new Date();
  wb.modified = new Date();  

  const sheet = wb.addWorksheet('observations');

  for(const obs of mappedObservations) {
    sheet.addRow(Object.values(obs.data || {}))
  }

  const filename = 'nvivo_export.xlsx'
  const result = await wb.xlsx.writeBuffer({ filename });


  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);

  return result;
}
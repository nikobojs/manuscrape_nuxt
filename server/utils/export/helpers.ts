import { ExportStatus, ExportType } from '@prisma/client';
import archiver from 'archiver';

export const archiverOptions: archiver.ArchiverOptions = {
  zlib: {
    level: 1,
    memLevel: 9,
    windowBits: 11
  },
  highWaterMark: 2147483648, // max 2gb
};

const exportPath = (projectId: number) => `projects/${projectId}/exports/`;
const dateToNumbers = (d: Date) => d.toISOString().replaceAll(/[^\d]/g, '');

export function generateFilename(
  projectId: number,
  fileType: ExportType,
  date = new Date(),
): string {
  const fileSuffixes = {
    [ExportType.MEDIA]: '-media.zip',
    [ExportType.UPLOADS]: '-uploads.zip',
    [ExportType.NVIVO]: '-nvivo.xlsx',
  }
  return exportPath(projectId) + dateToNumbers(date) + fileSuffixes[fileType];
}

export function exportIsDownloadable(
  projectExport: {
    status: ExportStatus;
    filePath: string | null;
    error: string | null;
  }
): boolean {
  return !!(
    projectExport.status === ExportStatus.DONE &&
    projectExport.filePath &&
    !projectExport.error
  );
}
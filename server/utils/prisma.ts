import { Prisma } from '@prisma-postgres/client';

export const observationColumns = {
  createdAt: true,
  data: true,
  id: true,
  isDraft: true,
  updatedAt: true,
  uploadInProgress: true,
  fileUploads: {
    select: {
      id: true,
      createdAt: true,
      mimetype: true,
      originalName: true,
    }
  },
  image: {
    select: {
      id: true,
      createdAt: true,
      mimetype: true,
      originalName: true,
    }
  },
  user: {
    select: {
      email: true,
      id: true,
    }
  }
} satisfies Prisma.ObservationSelect;

export const allFieldColumns = {
  id: true,
  index: true,
  createdAt: true,
  label: true,
  type: true,
  required: true,
  choices: true,
} satisfies Prisma.ProjectFieldSelect;

export const allDynamicFieldColumns = {
  createdAt: true,
  field0Id: true,
  field1Id: true,
  id: true,
  label: true,
  operator: true,
  field0: {
    select: {
      label: true,
      type: true,
    }
  },
  field1: {
    select: {
      label: true,
      type: true,
    }
  }
} satisfies Prisma.DynamicProjectFieldSelect;


export const smallProjectQuery = {
  id: true,
  createdAt: true,
  storageLimit: true,
  name: true,
  fields: {
    select: allFieldColumns,
    orderBy: [{
      index: 'asc'
    }]
  },
  authorCanDelockObservations: true,
  ownerCanDelockObservations: true,
  dynamicFields: { select: allDynamicFieldColumns },
  _count: {
      select: { observations: true }
  },
} satisfies Prisma.ProjectSelect;


export const bigUserQuery = {
  id: true,
  email: true,
  createdAt: true,
  projectAccess: {
    select: {
      project: {
        select: smallProjectQuery,
      },
      createdAt: true,
      projectId: true,
      nameInProject: true,
      role: true,
    }
  }
} satisfies Prisma.UserSelect;

export const exportProjectQuery = {
  id: true,
  createdAt: true,
  name: true,
  storageLimit: true,
  contributors: {
    select: {
      nameInProject: true,
      userId: true,
    }
  },
  fields: {
    select: allFieldColumns,
    orderBy: [{
      index: 'asc',
    }]
  },
  dynamicFields: { select: allDynamicFieldColumns },
  _count: {
      select: { observations: true }
  },
} satisfies Prisma.ProjectSelect;

export const projectExportQuery = {
  id: true,
  projectId: true,
  type: true,
  mimetype: true,
  createdAt: true,
  startDate: true,
  endDate: true,
  size: true,
  status: true,
  error: true,
  observationsCount: true,
  user: {
    select: {
      id: true,
      email: true,
    },
  },
} satisfies Prisma.ProjectExportSelect;

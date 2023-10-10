import { PrismaClient, Prisma } from '@prisma/client';

export const prisma = new PrismaClient();

export const observationColumns = {
  createdAt: true,
  data: true,
  id: true,
  imageId: true,
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
      email: true
    }
  }
};

export const bigUserQuery = {
  id: true,
  email: true,
  createdAt: true,
  projectAccess: {
    select: {
      project: {
        select: {
          id: true,
          createdAt: true,
          name: true,
          fields: {
            select: {
              id: true,
              index: true,
              createdAt: true,
              label: true,
              type: true,
              required: true,
              choices: true,
            },
            orderBy: {
              index: 'desc',
            }
          },
          dynamicFields: true,
          _count: {
              select: { observations: true }
          },
        },
      },
      role: true,
    }
  }
} satisfies Prisma.UserSelect;

export const exportProjectQuery = {
  id: true,
  createdAt: true,
  name: true,
  observations: {
    select: {
      data: true,
      fileUploads: true,
      createdAt: true,
      id: true,
      image: {
        select: {
          id: true,
          mimetype: true,
          s3Path: true,
          createdAt: true,
          originalName: true,
        }
      },
      updatedAt: true,
    },
    where: {
      image: {
        isNot: null,
      },
      isDraft: false,
    },
  },
  fields: {
    select: {
      id: true,
      index: true,
      createdAt: true,
      label: true,
      type: true,
      required: true,
      choices: true,
    },
    orderBy: {
      index: 'desc',
    }
  },
  dynamicFields: true,
  _count: {
      select: { observations: true }
  },
} satisfies Prisma.ProjectSelect;
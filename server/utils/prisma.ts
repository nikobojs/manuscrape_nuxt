import { PrismaClient, Prisma } from '@prisma/client';
import { DefaultArgs, UserArgs } from '@prisma/client/runtime/library';
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

export const bigUserQuery: Prisma.UserSelect<DefaultArgs> = {
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
              createdAt: true,
              label: true,
              type: true,
              required: true
            },
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
}
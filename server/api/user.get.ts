import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
    if (!event.context.auth?.id) {
        throw createError({
            statusMessage: 'Invalid auth token value',
            statusCode: 401,
        });
    }
    
    const user = await prisma.user.findFirst({
        where: { id: event.context.auth.id },
        select: {
            id: true,
            email: true,
            createdAt: true,
            projects: {
                select: {
                    id: true,
                    createdAt: true,
                    name: true,
                }
            }
        }
    });

    return user;
});
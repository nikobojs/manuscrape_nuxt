import { PrismaClient } from '@prisma/client';
import { safeResponseHandler } from '../utils/safeResponseHandler';

const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
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
                    fields: true,
                    observations: true,
                }
            }
        }
    });

    return user;
});
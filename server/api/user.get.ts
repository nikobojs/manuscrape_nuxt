import { PrismaClient } from '@prisma/client';
import { safeResponseHandler } from '../utils/safeResponseHandler';
import { requireUser } from '../utils/authorize';

const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
    const { id } = requireUser(event);
    
    const user = await prisma.user.findFirst({
        where: { id: id },
        select: {
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
                            fields: true,
                            dynamicFields: true,
                            _count: {
                                select: { observations: true }
                            }
                        },
                    },
                    role: true,
                }
            }
        }
    });

    return user;
});
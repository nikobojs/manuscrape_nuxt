import { safeResponseHandler } from '../utils/safeResponseHandler';
import { requireUser } from '../utils/authorize';
import { bigUserQuery } from '../utils/prisma';

export default safeResponseHandler(async (event) => {
    const { id } = requireUser(event);
    
    const user = await prisma.user.findFirst({
        where: { id: id },
        select: bigUserQuery,
    });

    return user;
});
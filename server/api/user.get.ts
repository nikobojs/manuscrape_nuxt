export default safeResponseHandler(async (event) => {
    const { id } = await requireUser(event);
    
    const user = await db.user.findFirst({
        where: { id: id },
        select: bigUserQuery,
    });

    return user;
});
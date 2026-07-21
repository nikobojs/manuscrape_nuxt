export function getCollaboratorName(col: {
  email: string | null;
  samlOrganizationName: string | null;
}): string {
  return col.email
    ? col.email
    : col?.samlOrganizationName
      ? `WAYF user from ${col.samlOrganizationName}`
      : "Anonymous";
}

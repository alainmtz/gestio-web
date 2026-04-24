const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(id: string | undefined | null): id is string {
  return !!id && UUID_REGEX.test(id)
}

export function isValidOrganizationId(id: string | undefined | null): boolean {
  return isValidUUID(id)
}
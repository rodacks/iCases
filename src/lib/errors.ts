/** Messages safe to show to a customer. Infrastructure errors stay on the server. */
export class PublicError extends Error {}
export class ServiceUnavailableError extends Error {}
export class AssetNotFoundError extends Error {}

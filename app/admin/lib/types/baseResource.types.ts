/**
 * Base type that all resources extend
 * Contains common properties: id, timestamps, etc.
 */
export interface BaseResource {
  id?: string | number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Helper type for resource creation (without id/timestamps)
 */
export type ResourceCreateData<T extends BaseResource> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

/**
 * Helper type for resource update (partial, without id/timestamps)
 */
export type ResourceUpdateData<T extends BaseResource> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Generic resource type for resources that only have id + custom fields
 * Usage example:
 * ```ts
 * type MyResourceType = GenericResource<{
 *   name: string;
 *   email: string;
 * }>;
 * ```
 */
export type GenericResource<T extends Record<string, unknown> = Record<string, unknown>> = 
  BaseResource & T;


export interface ITenant {
  id: string; // Unique identifier for the tenant
  name: string; // Name of the tenant (company name)
  domain?: string; // Optional domain associated with the tenant
  createdAt: Date; // Date when the tenant was created
  updatedAt?: Date; // Optional date when the tenant was last updated
  isActive: boolean; // Indicates if the tenant is currently active
  description?: string; // Optional description about the tenant
}

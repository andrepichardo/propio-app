/**
 * Public API of the Properties feature. Import from `@/features/properties`
 * rather than deep paths so the feature's internals can evolve freely.
 */
export { propertyService } from './services/property.service';
export {
  createPropertyAction,
  updatePropertyAction,
  deletePropertyAction,
} from './actions/property.actions';
export { PropertyStatusBadge } from './components/property-status-badge';
export { PropertyCard } from './components/property-card';
export * from './constants';
export type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilters,
} from './validators/property.validators';
export type { PropertyListItem } from './repositories/property.repository';

// Advanced Architecture Patterns - Export all enterprise features

// Event Sourcing (avoid naming conflicts)
export * as EventSourcing from '../event-sourcing/event-store';

// CQRS
export * as Commands from '../cqrs/commands';
export * as Queries from '../cqrs/queries';

// Enhanced Unit of Work
export * as UnitOfWork from '../unit-of-work/enhanced-uow';

// Specification Pattern
export * as Specifications from '../specifications/business-rules';

// Advanced Factories
export * as Factories from '../factories/advanced-factories';

// Re-export domain layer for convenience
export * as Domain from '../domain';
export * as DomainRepositories from '../repositories';
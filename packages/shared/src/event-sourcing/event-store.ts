// Event Sourcing Infrastructure - Complete audit trail and state reconstruction

import { DomainEvent } from '../domain/events';

// Event envelope for persistence
export interface EventEnvelope {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventVersion: number;
  payload: any;
  metadata: EventMetadata;
  timestamp: Date;
}

export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  source: string;
  [key: string]: any;
}

// Event store interface
export interface EventStore {
  saveEvents(
    aggregateId: string, 
    aggregateType: string,
    events: DomainEvent[], 
    expectedVersion: number,
    metadata?: EventMetadata
  ): Promise<void>;
  
  getEvents(
    aggregateId: string, 
    fromVersion?: number
  ): Promise<EventEnvelope[]>;
  
  getAllEvents(
    fromPosition?: number,
    batchSize?: number
  ): Promise<EventEnvelope[]>;
  
  getEventsByType(
    eventType: string,
    fromTimestamp?: Date
  ): Promise<EventEnvelope[]>;
}

// Aggregate repository using event sourcing
export interface EventSourcedRepository<T> {
  save(aggregate: T, expectedVersion: number): Promise<void>;
  getById(id: string): Promise<T | null>;
  exists(id: string): Promise<boolean>;
}

// Event stream for real-time subscriptions
export interface EventStream {
  subscribe(
    eventTypes: string[],
    handler: (event: EventEnvelope) => Promise<void>,
    fromPosition?: number
  ): Promise<EventSubscription>;
}

export interface EventSubscription {
  id: string;
  stop(): Promise<void>;
}

// Snapshot store for performance optimization
export interface SnapshotStore {
  saveSnapshot(
    aggregateId: string,
    aggregateType: string,
    version: number,
    data: any
  ): Promise<void>;
  
  getSnapshot(aggregateId: string): Promise<Snapshot | null>;
}

export interface Snapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: any;
  timestamp: Date;
}

// Event serialization
export interface EventSerializer {
  serialize(event: DomainEvent): string;
  deserialize(eventType: string, payload: string): DomainEvent;
}

// Optimistic concurrency control
export class ConcurrencyError extends Error {
  constructor(
    public readonly aggregateId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number
  ) {
    super(
      `Concurrency conflict for aggregate ${aggregateId}. ` +
      `Expected version ${expectedVersion}, but was ${actualVersion}`
    );
  }
}

// Event sourced aggregate base class
export abstract class EventSourcedAggregate {
  private _id: string;
  private _version: number = 0;
  private _uncommittedEvents: DomainEvent[] = [];

  constructor(id: string) {
    this._id = id;
  }

  get id(): string {
    return this._id;
  }

  get version(): number {
    return this._version;
  }

  get uncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  protected addEvent(event: DomainEvent): void {
    this._uncommittedEvents.push(event);
    this.apply(event);
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  loadFromHistory(events: EventEnvelope[]): void {
    events.forEach(envelope => {
      const event = this.deserializeEvent(envelope);
      this.apply(event);
      this._version = envelope.eventVersion;
    });
  }

  protected abstract apply(event: DomainEvent): void;
  protected abstract deserializeEvent(envelope: EventEnvelope): DomainEvent;
}

// Event bus for decoupled event handling
export interface EventBus {
  publish(events: DomainEvent[]): Promise<void>;
  publishEvent(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): Promise<void>;
}

export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
  canHandle(event: DomainEvent): boolean;
}

// Event projection for read models
export interface EventProjection {
  project(events: EventEnvelope[]): Promise<void>;
  reset(): Promise<void>;
  getLastProcessedPosition(): Promise<number>;
  setLastProcessedPosition(position: number): Promise<void>;
}

// Saga coordinator for complex workflows
export interface SagaCoordinator {
  handle(event: DomainEvent): Promise<void>;
  compensate(sagaId: string, reason: string): Promise<void>;
}

export interface SagaStep {
  execute(): Promise<void>;
  compensate(): Promise<void>;
}

// Event sourcing configuration
export interface EventSourcingConfig {
  snapshotFrequency: number; // Take snapshot every N events
  maxBatchSize: number;
  retryPolicy: RetryPolicy;
  serializer: EventSerializer;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}
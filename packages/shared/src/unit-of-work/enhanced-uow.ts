// Enhanced Unit of Work with Transaction Management and Event Publishing

import { DomainEvent } from '../domain/events';
import { EventStore, EventEnvelope } from '../event-sourcing/event-store';
import { 
  GameRepository, 
  QuestionRepository, 
  AnswerRepository, 
  ThemeRepository 
} from '../repositories';

// Enhanced Unit of Work interface
export interface EnhancedUnitOfWork {
  // Repository access
  games: GameRepository;
  questions: QuestionRepository;
  answers: AnswerRepository;
  themes: ThemeRepository;
  
  // Transaction management
  begin(options?: TransactionOptions): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  dispose(): Promise<void>;
  
  // Event management
  addEvents(aggregateId: string, aggregateType: string, events: DomainEvent[]): void;
  publishEvents(): Promise<void>;
  
  // State tracking
  isInTransaction(): boolean;
  getTransactionId(): string | null;
}

// Transaction isolation levels
export enum IsolationLevel {
  READ_UNCOMMITTED = 'READ_UNCOMMITTED',
  READ_COMMITTED = 'READ_COMMITTED',
  REPEATABLE_READ = 'REPEATABLE_READ',
  SERIALIZABLE = 'SERIALIZABLE'
}

// Transaction options
export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  timeout?: number; // milliseconds
  readOnly?: boolean;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

// Database transaction interface
export interface DatabaseTransaction {
  id: string;
  begin(options?: TransactionOptions): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
  createSavepoint(name: string): Promise<void>;
  rollbackToSavepoint(name: string): Promise<void>;
  releaseSavepoint(name: string): Promise<void>;
}

// Event collection for batched publishing
interface EventCollection {
  aggregateId: string;
  aggregateType: string;
  events: DomainEvent[];
  expectedVersion: number;
}

// Implementation of enhanced UoW
export class DatabaseUnitOfWork implements EnhancedUnitOfWork {
  private transaction: DatabaseTransaction | null = null;
  private eventCollections = new Map<string, EventCollection>();
  private isDisposed = false;

  constructor(
    public readonly games: GameRepository,
    public readonly questions: QuestionRepository,
    public readonly answers: AnswerRepository,
    public readonly themes: ThemeRepository,
    private readonly eventStore: EventStore,
    private readonly eventPublisher: EventPublisher,
    private readonly transactionFactory: TransactionFactory
  ) {}

  async begin(options?: TransactionOptions): Promise<void> {
    if (this.transaction?.isActive()) {
      throw new Error('Transaction already active');
    }

    this.transaction = await this.transactionFactory.create();
    await this.transaction.begin(options);
  }

  async commit(): Promise<void> {
    if (!this.transaction?.isActive()) {
      throw new Error('No active transaction to commit');
    }

    try {
      // Save events first (within transaction)
      await this.saveEvents();
      
      // Commit database transaction
      await this.transaction.commit();
      
      // Publish events after successful commit
      await this.publishEvents();
      
    } catch (error) {
      await this.rollback();
      throw error;
    } finally {
      this.clearEvents();
    }
  }

  async rollback(): Promise<void> {
    if (this.transaction?.isActive()) {
      await this.transaction.rollback();
    }
    this.clearEvents();
  }

  async dispose(): Promise<void> {
    if (this.isDisposed) return;
    
    try {
      if (this.transaction?.isActive()) {
        await this.rollback();
      }
    } finally {
      this.isDisposed = true;
      this.clearEvents();
    }
  }

  addEvents(aggregateId: string, aggregateType: string, events: DomainEvent[]): void {
    if (!events.length) return;

    const existing = this.eventCollections.get(aggregateId);
    if (existing) {
      existing.events.push(...events);
    } else {
      this.eventCollections.set(aggregateId, {
        aggregateId,
        aggregateType,
        events: [...events],
        expectedVersion: 0 // This should be properly calculated
      });
    }
  }

  async publishEvents(): Promise<void> {
    const allEvents: DomainEvent[] = [];
    
    for (const collection of this.eventCollections.values()) {
      allEvents.push(...collection.events);
    }

    if (allEvents.length > 0) {
      await this.eventPublisher.publishBatch(allEvents);
    }
  }

  isInTransaction(): boolean {
    return this.transaction?.isActive() ?? false;
  }

  getTransactionId(): string | null {
    return this.transaction?.id ?? null;
  }

  private async saveEvents(): Promise<void> {
    for (const collection of this.eventCollections.values()) {
      if (collection.events.length > 0) {
        await this.eventStore.saveEvents(
          collection.aggregateId,
          collection.aggregateType,
          collection.events,
          collection.expectedVersion
        );
      }
    }
  }

  private clearEvents(): void {
    this.eventCollections.clear();
  }
}

// Factory for creating transactions
export interface TransactionFactory {
  create(): Promise<DatabaseTransaction>;
}

// Event publisher interface
export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
}

// Outbox pattern for reliable event publishing
export interface OutboxEntry {
  id: string;
  aggregateId: string;
  eventType: string;
  eventData: string;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  createdAt: Date;
  publishedAt?: Date;
  retryCount: number;
  lastError?: string;
}

export class OutboxEventPublisher implements EventPublisher {
  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly messagePublisher: MessagePublisher
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.publishBatch([event]);
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    // Store events in outbox (within same transaction)
    const entries = events.map(event => ({
      id: crypto.randomUUID(),
      aggregateId: this.extractAggregateId(event),
      eventType: event.getEventName(),
      eventData: JSON.stringify(event),
      status: 'PENDING' as const,
      createdAt: new Date(),
      retryCount: 0
    }));

    await this.outboxRepository.saveBatch(entries);
  }

  // Separate process polls and publishes outbox events
  async processOutboxEvents(batchSize: number = 100): Promise<void> {
    const pendingEvents = await this.outboxRepository.getPending(batchSize);
    
    for (const entry of pendingEvents) {
      try {
        await this.messagePublisher.publish(entry.eventType, entry.eventData);
        await this.outboxRepository.markAsPublished(entry.id);
      } catch (error) {
        await this.outboxRepository.markAsFailed(
          entry.id, 
          error instanceof Error ? error.message : String(error),
          entry.retryCount + 1
        );
      }
    }
  }

  private extractAggregateId(event: DomainEvent): string {
    // Extract aggregate ID from event
    return (event as any).gameId?.getValue() || 
           (event as any).aggregateId || 
           'unknown';
  }
}

export interface OutboxRepository {
  saveBatch(entries: Omit<OutboxEntry, 'id'>[]): Promise<void>;
  getPending(limit: number): Promise<OutboxEntry[]>;
  markAsPublished(id: string): Promise<void>;
  markAsFailed(id: string, error: string, retryCount: number): Promise<void>;
  getFailedEntries(maxRetries: number): Promise<OutboxEntry[]>;
}

export interface MessagePublisher {
  publish(eventType: string, eventData: string): Promise<void>;
}

// UoW Factory with dependency injection
export class UnitOfWorkFactory {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly answerRepository: AnswerRepository,
    private readonly themeRepository: ThemeRepository,
    private readonly eventStore: EventStore,
    private readonly eventPublisher: EventPublisher,
    private readonly transactionFactory: TransactionFactory
  ) {}

  create(): EnhancedUnitOfWork {
    return new DatabaseUnitOfWork(
      this.gameRepository,
      this.questionRepository,
      this.answerRepository,
      this.themeRepository,
      this.eventStore,
      this.eventPublisher,
      this.transactionFactory
    );
  }
}

// UoW manager for scoped instances
export class UnitOfWorkManager {
  private current: EnhancedUnitOfWork | null = null;

  constructor(private readonly factory: UnitOfWorkFactory) {}

  getCurrent(): EnhancedUnitOfWork {
    if (!this.current) {
      this.current = this.factory.create();
    }
    return this.current;
  }

  async complete(): Promise<void> {
    if (this.current) {
      try {
        await this.current.commit();
      } finally {
        await this.current.dispose();
        this.current = null;
      }
    }
  }

  async rollback(): Promise<void> {
    if (this.current) {
      try {
        await this.current.rollback();
      } finally {
        await this.current.dispose();
        this.current = null;
      }
    }
  }
}

// Decorator for automatic UoW management
export function Transactional(
  isolationLevel?: IsolationLevel,
  timeout?: number
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const uowManager: UnitOfWorkManager = (this as any).uowManager;
      
      if (!uowManager) {
        throw new Error('UnitOfWorkManager not found');
      }

      const uow = uowManager.getCurrent();
      
      if (!uow.isInTransaction()) {
        await uow.begin({ isolationLevel, timeout });
        
        try {
          const result = await method.apply(this, args);
          await uowManager.complete();
          return result;
        } catch (error) {
          await uowManager.rollback();
          throw error;
        }
      } else {
        // Already in transaction, just execute
        return method.apply(this, args);
      }
    };
  };
}
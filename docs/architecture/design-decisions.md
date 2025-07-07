# Database Design Decisions

This document explains the architectural decisions made in our ERD and addresses common concerns about the design.

## Intentional Design Patterns

### 1. Data Denormalization in Order Items

**Decision**: Store snapshots of item data in `order_items` table
```sql
order_items {
  item_name_snapshot        -- Copy of original name
  item_description_snapshot -- Copy of original description  
  unit_price_snapshot      -- Copy of original price
}
```

**Rationale**: 
- **Historical Accuracy**: Prices and names change over time
- **Audit Compliance**: Financial records must reflect transaction-time values
- **Performance**: Avoids complex joins for order history
- **Data Integrity**: Orders remain valid even if original items are deleted

**Trade-off**: Slight data redundancy for critical business accuracy

### 2. Separate Address Storage for Different Purposes

**Decision**: Multiple address storage approaches
- `addresses` table: Structured, geocoded addresses for venues/locations
- `business_profiles.address`: Text field for iyzico compliance
- `user_addresses`: User billing/shipping addresses

**Rationale**:
- **Different Use Cases**: Geocoding vs compliance vs billing
- **iyzico Requirements**: Payment processor needs specific address format
- **Performance**: Optimized for different query patterns

**Not Redundancy**: Each serves distinct business purposes

### 3. Identity Number in Multiple Tables

**Decision**: Store identity numbers in both `user_personal_data` and `business_profiles`
```sql
user_personal_data {
  identity_number  -- User's personal ID
}
business_profiles {
  identity_number  -- Business owner's ID (for iyzico)
}
```

**Rationale**:
- **Different Contexts**: Personal identity vs business verification
- **iyzico Compliance**: Required for PERSONAL and PRIVATE_COMPANY merchant types
- **Data Separation**: User data vs business compliance data

**Not Duplication**: Different legal and compliance purposes

### 4. iyzico-Specific Fields in Schema

**Decision**: Include iyzico-specific fields directly in tables rather than only JSONB

**Rationale**:
- **Legal Compliance**: Turkish payment regulations require specific data
- **Query Performance**: Structured fields faster than JSONB queries  
- **Data Validation**: Database constraints ensure compliance
- **Integration Reliability**: Structured data reduces API errors

**Future Flexibility**: Additional payment providers can be added via `payment_profiles`

## Scalability Solutions

### 1. Chat Message Architecture

**Problem**: Chat messages table grows exponentially
**Solution**: 
```sql
chat_messages {
  -- Active messages (last 30 days)
  is_archived BOOLEAN
}

chat_messages_archive {
  -- Partitioned by month for historical data
  archive_month DATE
}
```

**Benefits**:
- Fast queries on active conversations
- Automated archiving of old messages  
- Partitioned archive for historical access
- Cleanup procedures for storage management

**Operational Monitoring Requirements**:

**Archive Job Health Monitoring**:
```sql
-- Monitor archive job execution
CREATE TABLE chat_archive_jobs (
  id UUID PRIMARY KEY,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  messages_archived INTEGER,
  status VARCHAR(20), -- 'running', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alert thresholds
SELECT 
  COUNT(*) as active_messages,
  (COUNT(*) * 100.0 / 50000) as table_utilization_percent
FROM chat_messages 
WHERE is_archived = false;
```

**Graceful Degradation Strategy**:
- **Warning threshold**: 50,000 active messages (start archiving acceleration)
- **Critical threshold**: 100,000 active messages (emergency archiving)
- **Emergency procedure**: Direct archive old messages without job queue

**Monitoring Alerts**:
- Archive job failure (immediate alert)
- Archive job not run in 24 hours (warning)
- Active messages > 50k (warning)  
- Active messages > 100k (critical)
- Archive job execution time > 30 minutes (performance alert)

**Performance Degradation Handling**:
```sql
-- Emergency archiving when job fails
INSERT INTO chat_messages_archive 
SELECT 
  id, chat_id, sender_id, content, message_type, 
  reply_to_id, is_edited, 
  DATE_TRUNC('month', created_at) as archive_month,
  created_at, NOW() as archived_at
FROM chat_messages 
WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_archived = false;

-- Mark as archived
UPDATE chat_messages 
SET is_archived = true 
WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_archived = false;
```

### 2. Polymorphic Referential Integrity

**Problem**: Polymorphic relationships can't enforce foreign keys
**Solution**:
```sql
entity_types {
  -- Registry of valid entity types
  entity_type VARCHAR PRIMARY KEY
  table_name VARCHAR
  supports_media BOOLEAN
}

media {
  entity_exists BOOLEAN
  entity_last_checked TIMESTAMP
}
```

**Benefits**:
- Application-level integrity validation
- Orphaned record detection and cleanup
- Entity type registry for validation
- Monitoring of referential integrity health

### 3. Flexible Order Items

**Problem**: Limited to ticket sales only
**Solution**:
```sql
order_items {
  orderable_id UUID      -- Points to any sellable item
  orderable_type VARCHAR -- 'ticket_type', 'product', 'service'
}

orderable_types {
  -- Configuration for different item types
  orderable_type VARCHAR PRIMARY KEY
  table_name VARCHAR
  price_column VARCHAR
}
```

**Benefits**:
- Support for tickets, merchandise, services, campaigns
- Extensible to new product types
- Consistent ordering interface
- Backward compatibility maintained

## Security Considerations

### 1. PII Data Handling

**Approach**: Centralized sensitive data storage
- `user_personal_data`: Primary PII storage
- Clear field naming for sensitive data
- Separate from public profile information

**Implementation Notes**:
- Encrypt sensitive fields at application layer
- Implement field-level access controls
- Audit access to PII data
- GDPR compliance through data separation

### 2. Payment Data Security

**Approach**: Structured payment compliance
- Business verification data in structured fields
- Payment processor configs in JSONB
- Clear separation of business identity vs payment processing

## Media Storage Consolidation

### Event Media Migration

**Decision**: Consolidate `event_media` into the polymorphic `media` table

**Rationale**:
- **Eliminates Redundancy**: Two separate media storage systems created confusion
- **Unified Interface**: Single API for all media operations across entities
- **Consistent Metadata**: All media gets same rich metadata (file_size, dimensions, alt_text)
- **Referential Integrity**: Polymorphic integrity checking applies to all media

**Migration Strategy**:
```sql
-- 1. Configure event entity type
INSERT INTO entity_types (entity_type, table_name, supports_media, supports_reviews, supports_favorites)
VALUES ('event', 'events', true, true, true);

-- 2. Migrate existing event_media to polymorphic media table
INSERT INTO media (entity_id, entity_type, file_url, file_type, sort_order, created_at)
SELECT event_id, 'event', media_url, type::varchar, sort_order, created_at 
FROM event_media;

-- 3. Verify migration
SELECT COUNT(*) FROM media WHERE entity_type = 'event';

-- 4. Drop old table after verification
DROP TABLE event_media;
```

**Benefits**:
- Single codebase for media handling
- Consistent validation and processing
- Unified security and access controls
- Simplified maintenance and monitoring

## Performance Optimizations

### 1. Search Cache Strategy

**Design**: Centralized search with cache invalidation
```sql
search_cache {
  entity_type VARCHAR
  search_vector TSVECTOR
  content TEXT
}
```

**Strategy**:
- Event-driven cache updates
- Full-text search optimization
- Entity-based cache invalidation
- Periodic cache health checks

### 2. Counter Caching

**Implementation**: Denormalized counters for performance
```sql
event_chats {
  message_count INTEGER    -- Avoids COUNT() queries
  last_message_at TIMESTAMP
}

chat_participants {
  unread_count INTEGER     -- Fast unread calculations
}
```

**Counter Consistency Protection**:

**Atomic Update Pattern**:
```sql
-- Example: Adding a new message
BEGIN TRANSACTION;
  INSERT INTO chat_messages (chat_id, sender_id, content, created_at) 
  VALUES ($1, $2, $3, NOW());
  
  UPDATE event_chats 
  SET message_count = message_count + 1,
      last_message_at = NOW()
  WHERE id = $1;
  
  UPDATE chat_participants 
  SET unread_count = unread_count + 1
  WHERE chat_id = $1 AND user_id != $2;
COMMIT;
```

**Reconciliation Procedures**:
```sql
-- Daily reconciliation job to detect and fix drift
WITH actual_counts AS (
  SELECT 
    chat_id,
    COUNT(*) as actual_message_count,
    MAX(created_at) as actual_last_message
  FROM chat_messages 
  WHERE is_archived = false
  GROUP BY chat_id
)
SELECT 
  ec.id,
  ec.message_count as cached_count,
  ac.actual_message_count,
  (ec.message_count - ac.actual_message_count) as drift
FROM event_chats ec
LEFT JOIN actual_counts ac ON ec.id = ac.chat_id
WHERE ec.message_count != COALESCE(ac.actual_message_count, 0);

-- Fix detected drift
UPDATE event_chats 
SET message_count = (
  SELECT COUNT(*) 
  FROM chat_messages 
  WHERE chat_id = event_chats.id AND is_archived = false
)
WHERE id IN (SELECT id FROM drift_detection_query);
```

**Monitoring Requirements**:
- Alert on counter drift > 5% of actual values
- Daily reconciliation job execution monitoring
- Transaction failure rate monitoring for counter updates

## Business Rules Enforcement

### 1. iyzico Merchant Type Validation

**Rules**: Different merchant types require different fields
- PERSONAL: `contact_name`, `contact_surname`, `identity_number`
- PRIVATE_COMPANY: `legal_company_title`, `tax_office`, `identity_number`
- LIMITED_OR_JOINT_STOCK_COMPANY: `legal_company_title`, `tax_office`, `tax_number`

**Enforcement**: Application-level validation based on `iyzico_merchant_type`

### 2. Order Item Validation

**Rules**: Polymorphic items must exist and be purchasable
**Enforcement**: 
- Check against `orderable_types` registry
- Validate item exists in target table
- Confirm item is active/available

## Configuration Management Automation

### 1. Entity Types Registry Management

**Deployment Synchronization**:
```sql
-- Migration template for new entity types
INSERT INTO entity_types (
  entity_type, table_name, id_column, 
  supports_media, supports_reviews, supports_favorites, 
  created_at
) VALUES 
('product', 'products', 'id', true, true, true, NOW()),
('service', 'services', 'id', true, true, true, NOW())
ON CONFLICT (entity_type) DO UPDATE SET
  table_name = EXCLUDED.table_name,
  supports_media = EXCLUDED.supports_media;

-- Validation query for deployment pipeline
SELECT 
  et.entity_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = et.table_name
  ) THEN 'EXISTS' ELSE 'MISSING' END as table_status
FROM entity_types et;
```

**Automated Validation Process**:
```bash
# Pre-deployment validation script
#!/bin/bash
# Check entity_types configuration matches application code

# 1. Extract entity types from application code
grep -r "entity_type.*=.*['\"]" app/ | \
  sed -n "s/.*entity_type.*=.*['\"]\\([^'\"]*\\)['\"].*/\\1/p" | \
  sort -u > /tmp/code_entity_types.txt

# 2. Extract entity types from database
psql -c "SELECT entity_type FROM entity_types;" -t | \
  grep -v '^$' | sed 's/^ *//' > /tmp/db_entity_types.txt

# 3. Compare and alert on differences
if ! diff /tmp/code_entity_types.txt /tmp/db_entity_types.txt; then
  echo "ERROR: Entity types mismatch between code and database"
  exit 1
fi
```

### 2. Orderable Types Configuration

**Deployment Process**:
```sql
-- Migration for new orderable types
INSERT INTO orderable_types (
  orderable_type, table_name, id_column, 
  name_column, price_column, is_active, 
  description, created_at
) VALUES 
('ticket_type', 'ticket_types', 'id', 'name', 'price', true, 'Event tickets', NOW()),
('product', 'products', 'id', 'name', 'price', true, 'Physical products', NOW()),
('service', 'services', 'id', 'title', 'hourly_rate', true, 'Professional services', NOW())
ON CONFLICT (orderable_type) DO UPDATE SET
  table_name = EXCLUDED.table_name,
  name_column = EXCLUDED.name_column,
  price_column = EXCLUDED.price_column,
  is_active = EXCLUDED.is_active;

-- Configuration validation
CREATE OR REPLACE FUNCTION validate_orderable_type_config()
RETURNS TABLE(orderable_type VARCHAR, table_exists BOOLEAN, columns_exist BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ot.orderable_type,
    EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = ot.table_name
    ) as table_exists,
    (
      EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = ot.table_name AND column_name = ot.id_column) AND
      EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = ot.table_name AND column_name = ot.name_column) AND
      EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = ot.table_name AND column_name = ot.price_column)
    ) as columns_exist
  FROM orderable_types ot
  WHERE ot.is_active = true;
END;
$$ LANGUAGE plpgsql;
```

### 3. Deployment Checklist

**Pre-deployment Validation**:
- [ ] Run entity types validation script
- [ ] Verify orderable types configuration
- [ ] Test polymorphic integrity checks
- [ ] Validate all required tables exist
- [ ] Check column mappings are correct

**Post-deployment Verification**:
- [ ] Run configuration validation functions
- [ ] Test polymorphic entity creation
- [ ] Verify integrity check jobs are running
- [ ] Monitor for configuration-related errors

**Rollback Procedures**:
```sql
-- Safe rollback of configuration changes
UPDATE entity_types SET supports_media = false 
WHERE entity_type = 'new_entity' AND created_at > (NOW() - INTERVAL '1 hour');

UPDATE orderable_types SET is_active = false 
WHERE orderable_type = 'new_type' AND created_at > (NOW() - INTERVAL '1 hour');
```

## Migration Strategy

### 1. Backward Compatibility

**Approach**: Gradual migration with compatibility layers
- Maintain existing `ticket_type_id` references during transition
- Add polymorphic fields alongside existing ones
- Migrate data in batches with validation

### 2. Data Integrity During Migration

**Process**:
1. Add new polymorphic fields
2. Populate polymorphic data from existing relationships
3. Add validation triggers
4. Remove old fields after validation
5. Update application code incrementally

## Monitoring and Maintenance

### 1. Data Health Checks

**Automated Checks**:
- Polymorphic referential integrity validation
- Chat message archive scheduling
- Search cache freshness monitoring
- Order item consistency verification

### 2. Performance Monitoring

**Metrics**:
- Chat table size and query performance
- Search cache hit rates
- Order processing times
- Payment integration success rates

This architecture balances business requirements, legal compliance, performance, and maintainability while providing clear paths for future expansion.

## Production-Scale Considerations

The following are advanced architectural challenges that will need to be addressed when scaling to full production deployment:

### 1. Data Privacy vs. Auditability (GDPR Compliance)

**Challenge**: Our extensive audit trails (chat archives, moderation logs, transaction history) conflict with GDPR's "right to be forgotten" requirement.

**Current Gap**: Simple user deletion isn't sufficient - we need comprehensive PII scrubbing across all tables while maintaining data integrity.

**Future Implementation Requirements**:
- Data lifecycle management strategy
- Anonymization procedures for archived data
- PII scrubbing scripts that preserve conversation/transaction context
- Special `deleted_user_id` handling for maintaining referential integrity
- Legal review of data retention policies

### 2. Advanced Financial Operations

**Challenge**: Production payment systems require handling complex scenarios not explicitly modeled in the current schema.

**Current Gap**: While our foundation supports basic e-commerce, advanced financial operations need explicit modeling.

**Future Implementation Requirements**:
- Refund tracking with partial refund impact on commissions
- Chargeback and dispute reconciliation with iyzico events
- Immutable financial event log for complete audit trail
- Split payment calculations for complex marketplace scenarios
- Currency conversion and fee calculations for international transactions

### 3. Inventory Concurrency Control

**Challenge**: Race conditions during high-demand ticket sales can lead to overselling.

**Current Gap**: While transaction patterns are documented, explicit inventory locking strategy needs specification.

**Implementation Requirement**:
```sql
-- Required pattern for ticket purchases
BEGIN TRANSACTION;
  SELECT quantity_total - quantity_sold as available
  FROM ticket_types 
  WHERE id = $ticket_type_id 
  FOR UPDATE;
  
  -- Verify availability, then update
  UPDATE ticket_types 
  SET quantity_sold = quantity_sold + $quantity
  WHERE id = $ticket_type_id 
    AND (quantity_total - quantity_sold) >= $quantity;
COMMIT;
```

**Note**: These considerations represent the natural evolution from a well-designed foundational system to a production-scale platform capable of handling real-world complexity and compliance requirements.

---

# Operational Runbook

## Daily Operations

### 1. Health Check Dashboard

**Key Metrics to Monitor**:
```sql
-- System health summary
SELECT 
  'Active Chat Messages' as metric,
  COUNT(*) as value,
  CASE WHEN COUNT(*) > 50000 THEN 'WARNING' 
       WHEN COUNT(*) > 100000 THEN 'CRITICAL' 
       ELSE 'OK' END as status
FROM chat_messages WHERE is_archived = false

UNION ALL

SELECT 
  'Counter Drift Detection' as metric,
  COUNT(*) as value,
  CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END as status
FROM (
  SELECT ec.id FROM event_chats ec
  LEFT JOIN (
    SELECT chat_id, COUNT(*) as actual_count 
    FROM chat_messages WHERE is_archived = false GROUP BY chat_id
  ) cm ON ec.id = cm.chat_id
  WHERE ec.message_count != COALESCE(cm.actual_count, 0)
) drift_check

UNION ALL

SELECT 
  'Orphaned Records' as metric,
  COUNT(*) as value,
  CASE WHEN COUNT(*) > 100 THEN 'WARNING' ELSE 'OK' END as status
FROM orphaned_records WHERE cleaned_up = false;
```

### 2. Daily Maintenance Tasks

**Automated Jobs Schedule**:
- **00:00 UTC**: Chat message archiving (daily)
- **01:00 UTC**: Counter cache reconciliation (daily)
- **02:00 UTC**: Orphaned records cleanup (daily)
- **03:00 UTC**: Search cache refresh (daily)
- **06:00 UTC**: Configuration validation (daily)

**Manual Verification Checklist**:
- [ ] Review job execution logs
- [ ] Check alert notifications
- [ ] Verify backup completion
- [ ] Monitor database performance metrics
- [ ] Review error rates and response times

## Incident Response

### 1. Chat System Performance Degradation

**Symptoms**: Slow chat loading, high response times
**Immediate Response**:
```sql
-- Check active message count
SELECT COUNT(*) FROM chat_messages WHERE is_archived = false;

-- If > 100k messages, trigger emergency archiving
INSERT INTO chat_messages_archive 
SELECT id, chat_id, sender_id, content, message_type, reply_to_id, is_edited,
       DATE_TRUNC('month', created_at), created_at, NOW()
FROM chat_messages 
WHERE created_at < NOW() - INTERVAL '7 days' AND is_archived = false;

UPDATE chat_messages SET is_archived = true 
WHERE created_at < NOW() - INTERVAL '7 days' AND is_archived = false;
```

### 2. Counter Cache Drift

**Symptoms**: Incorrect unread counts, message counts
**Recovery Process**:
```sql
-- Fix chat message counts
UPDATE event_chats SET message_count = (
  SELECT COUNT(*) FROM chat_messages 
  WHERE chat_id = event_chats.id AND is_archived = false
);

-- Fix unread counts
UPDATE chat_participants SET unread_count = (
  SELECT COUNT(*) FROM chat_messages cm
  WHERE cm.chat_id = chat_participants.chat_id 
    AND cm.created_at > chat_participants.last_read_at
    AND cm.sender_id != chat_participants.user_id
    AND cm.is_archived = false
);
```

### 3. Polymorphic Integrity Issues

**Symptoms**: 404 errors, broken media/favorites
**Detection and Cleanup**:
```sql
-- Detect orphaned favorites
INSERT INTO orphaned_records (source_table, source_record_id, entity_type, entity_id, detected_at)
SELECT 'favorites', f.id, f.favoritable_type, f.favoritable_id, NOW()
FROM favorites f
LEFT JOIN entity_types et ON f.favoritable_type = et.entity_type
WHERE et.entity_type IS NULL OR f.entity_exists = false;

-- Mark and cleanup
UPDATE favorites SET entity_exists = false 
WHERE id IN (SELECT source_record_id FROM orphaned_records WHERE source_table = 'favorites');
```

## Performance Tuning

### 1. Database Optimization

**Index Monitoring**:
```sql
-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats 
WHERE tablename IN ('chat_messages', 'order_items', 'favorites', 'media')
ORDER BY tablename, attname;

-- Missing indexes detection
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
FROM pg_stat_user_tables 
WHERE seq_scan > idx_scan AND seq_tup_read > 1000000;
```

**Recommended Indexes**:
```sql
-- High-performance chat queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_active 
ON chat_messages (chat_id, created_at) WHERE is_archived = false;

-- Polymorphic entity lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_entity 
ON favorites (favoritable_type, favoritable_id);

-- Order processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_orderable 
ON order_items (orderable_type, orderable_id);
```

### 2. Application Performance

**Query Optimization Patterns**:
- Use entity_exists flags to avoid unnecessary joins
- Batch polymorphic lookups by entity_type
- Leverage counter caches for counts
- Use archived flags for time-based filtering

## Scaling Guidelines

### 1. Horizontal Scaling Triggers

**Database Scaling Indicators**:
- Chat messages > 1M active records
- Order volume > 10k/day
- Concurrent users > 10k
- Response time > 500ms average

**Scaling Strategies**:
- Read replicas for reporting queries
- Chat service extraction to separate database
- Order processing queue implementation
- CDN for media file delivery

### 2. Capacity Planning

**Monthly Review Metrics**:
- Database growth rate (GB/month)
- Message volume trends
- Order processing times
- System resource utilization

**Scaling Decision Matrix**:
- **< 1M records**: Single database instance
- **1M-10M records**: Read replicas + optimizations
- **10M-100M records**: Service separation + caching
- **> 100M records**: Microservices architecture

## Security Operations

### 1. Data Access Monitoring

**Audit Queries**:
```sql
-- PII access tracking
SELECT user_id, COUNT(*) as access_count, MAX(accessed_at) as last_access
FROM user_personal_data_access_log 
WHERE accessed_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(*) > 100;  -- Flag suspicious access patterns
```

### 2. Compliance Maintenance

**Regular Tasks**:
- Verify RLS policies are active
- Audit PII data access logs
- Review payment compliance fields
- Check encryption at rest status
- Validate backup encryption

This operational runbook ensures the enhanced schema maintains performance, integrity, and compliance in production environments.
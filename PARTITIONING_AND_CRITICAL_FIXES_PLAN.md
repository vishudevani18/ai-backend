# Partitioning Strategy & Critical Fixes Implementation Plan

**Date:** 2024  
**Status:** Implementation Plan  
**Priority:** CRITICAL - Required before production scale

---

## Overview

This document outlines the implementation plan for:
1. **Partitioning Strategy** for `generated_images` and `credit_transactions` tables
2. **Critical FK Constraints** fixes
3. **NOT NULL Constraints** improvements
4. **Migration Strategy** for production deployment

---

## 1. Partitioning Strategy

### 1.1 GeneratedImage Table Partitioning

#### Current State
- **Table:** `generated_images`
- **Growth Rate:** High (user-generated content)
- **Retention:** 6 hours (expiresAt), but records kept for audit
- **Risk:** Table will grow to millions of rows without partitioning

#### Partitioning Plan

**Strategy: Range Partitioning by `created_at` (Monthly)**

```sql
-- Step 1: Create partitioned table structure
CREATE TABLE generated_images_partitioned (
  LIKE generated_images INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Step 2: Create partitions for current and future months
-- Current month
CREATE TABLE generated_images_2024_01 PARTITION OF generated_images_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE generated_images_2024_02 PARTITION OF generated_images_partitioned
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Future partitions (create 3 months ahead)
CREATE TABLE generated_images_2024_03 PARTITION OF generated_images_partitioned
  FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Step 3: Create default partition for safety
CREATE TABLE generated_images_default PARTITION OF generated_images_partitioned
  DEFAULT;

-- Step 4: Migrate existing data
INSERT INTO generated_images_partitioned 
SELECT * FROM generated_images;

-- Step 5: Rename tables (atomic operation)
BEGIN;
ALTER TABLE generated_images RENAME TO generated_images_old;
ALTER TABLE generated_images_partitioned RENAME TO generated_images;
COMMIT;

-- Step 6: Verify and drop old table (after verification)
-- DROP TABLE generated_images_old;
```

#### Benefits
- ✅ **Query Performance:** Partition pruning for date-range queries
- ✅ **Maintenance:** VACUUM and ANALYZE per partition (faster)
- ✅ **Archiving:** Easy to detach old partitions
- ✅ **Storage:** Can compress old partitions

#### Maintenance Strategy

**Monthly Partition Creation (Automated)**
```sql
-- Create partition for next month (run monthly via cron)
CREATE TABLE generated_images_2024_04 PARTITION OF generated_images
  FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
```

**Archiving Old Partitions (Quarterly)**
```sql
-- Detach partition older than 1 year
ALTER TABLE generated_images 
  DETACH PARTITION generated_images_2023_01;

-- Move to archive storage or backup
-- Option 1: Keep as separate table
ALTER TABLE generated_images_2023_01 RENAME TO generated_images_archive_2023_01;

-- Option 2: Export to cold storage and drop
-- pg_dump -t generated_images_2023_01 > archive_2023_01.sql
-- DROP TABLE generated_images_2023_01;
```

#### Index Strategy for Partitioned Table

```sql
-- Global indexes (work across all partitions)
CREATE INDEX idx_generated_images_user_status ON generated_images(user_id, generation_status) 
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_generated_images_expires_at ON generated_images(expires_at) 
  WHERE expires_at < NOW();

CREATE INDEX idx_generated_images_type_status_created ON generated_images(generation_type, generation_status, created_at);

-- Local indexes (created automatically on each partition)
-- TypeORM will handle these via entity decorators
```

#### TypeORM Entity Changes

```typescript
// No changes needed to entity - TypeORM supports partitioned tables
// Just ensure created_at is used in queries for partition pruning
```

---

### 1.2 CreditTransaction Table Partitioning

#### Current State
- **Table:** `credit_transactions`
- **Growth Rate:** Very High (every credit operation creates a record)
- **Retention:** Permanent (audit trail)
- **Risk:** Table will grow indefinitely, queries will slow down

#### Partitioning Plan

**Strategy: Range Partitioning by `created_at` (Monthly)**

```sql
-- Step 1: Create partitioned table structure
CREATE TABLE credit_transactions_partitioned (
  LIKE credit_transactions INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Step 2: Create partitions
CREATE TABLE credit_transactions_2024_01 PARTITION OF credit_transactions_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE credit_transactions_2024_02 PARTITION OF credit_transactions_partitioned
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Default partition
CREATE TABLE credit_transactions_default PARTITION OF credit_transactions_partitioned
  DEFAULT;

-- Step 3: Migrate existing data
INSERT INTO credit_transactions_partitioned 
SELECT * FROM credit_transactions;

-- Step 4: Rename tables
BEGIN;
ALTER TABLE credit_transactions RENAME TO credit_transactions_old;
ALTER TABLE credit_transactions_partitioned RENAME TO credit_transactions;
COMMIT;
```

#### Benefits
- ✅ **Query Performance:** Fast queries on recent transactions
- ✅ **Analytics:** Can query specific time periods efficiently
- ✅ **Archiving:** Easy to archive old transactions
- ✅ **Maintenance:** Faster VACUUM and ANALYZE

#### Archiving Strategy

**Archive Transactions Older Than 1 Year**
```sql
-- Quarterly archiving process:
-- 1. Detach old partition
ALTER TABLE credit_transactions 
  DETACH PARTITION credit_transactions_2023_01;

-- 2. Move to archive table
ALTER TABLE credit_transactions_2023_01 
  RENAME TO credit_transactions_archive_2023_01;

-- 3. Optional: Compress archive table
-- ALTER TABLE credit_transactions_archive_2023_01 SET (
--   toast_tuple_target = 128,
--   fillfactor = 100
-- );
```

#### Index Strategy

```sql
-- Global indexes
CREATE INDEX idx_credit_transactions_user_created ON credit_transactions(user_id, created_at);
CREATE INDEX idx_credit_transactions_operation_type ON credit_transactions(operation_type);

-- These indexes work across all partitions automatically
```

---

### 1.3 Partitioning Implementation Timeline

#### Phase 1: Preparation (Week 1)
- [ ] Create partitioning scripts
- [ ] Test on staging database
- [ ] Backup production database
- [ ] Schedule maintenance window

#### Phase 2: GeneratedImage Partitioning (Week 2)
- [ ] Create partitioned table structure
- [ ] Migrate existing data (during low-traffic window)
- [ ] Switch tables (atomic operation)
- [ ] Verify queries work correctly
- [ ] Monitor performance

#### Phase 3: CreditTransaction Partitioning (Week 3)
- [ ] Create partitioned table structure
- [ ] Migrate existing data
- [ ] Switch tables
- [ ] Verify transaction queries
- [ ] Monitor performance

#### Phase 4: Automation (Week 4)
- [ ] Set up monthly partition creation (cron job)
- [ ] Set up quarterly archiving process
- [ ] Monitor partition sizes
- [ ] Document maintenance procedures

---

## 2. Critical FK Constraints Fixes

### 2.1 GeneratedImage User FK Constraint

#### Current Issue
```typescript
// Current: userId is nullable with no FK constraint
@Column({ name: 'user_id', type: 'uuid', nullable: true })
userId?: string;
```

#### Fix Plan

**Option 1: Add FK with SET NULL (Recommended)**
```sql
-- Add FK constraint allowing NULL
ALTER TABLE generated_images 
  ADD CONSTRAINT fk_generated_images_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- This allows NULL values (for future anonymous generations)
-- But ensures referential integrity when userId is set
```

**Option 2: Make NOT NULL and Add FK**
```sql
-- If userId should always be set:
-- 1. Update existing NULL values (if any)
UPDATE generated_images SET user_id = 'system-user-id' WHERE user_id IS NULL;

-- 2. Add NOT NULL constraint
ALTER TABLE generated_images 
  ALTER COLUMN user_id SET NOT NULL;

-- 3. Add FK constraint
ALTER TABLE generated_images 
  ADD CONSTRAINT fk_generated_images_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;
```

**Recommendation:** Use Option 1 (allows NULL for future anonymous generations)

#### TypeORM Entity Update
```typescript
// Add FK relationship (TypeORM will create constraint)
@ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'user_id' })
user?: User;

// Keep column as nullable
@Column({ name: 'user_id', type: 'uuid', nullable: true })
userId?: string;
```

---

### 2.2 GeneratedImage Admin Table FK Constraints

#### Current Issue
All FK columns to admin tables (industryId, categoryId, etc.) have no FK constraints.

#### Fix Plan

```sql
-- Add FK constraints with RESTRICT (prevent deletion if images exist)
ALTER TABLE generated_images 
  ADD CONSTRAINT fk_generated_images_industry_id 
  FOREIGN KEY (industry_id) REFERENCES industries(id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

ALTER TABLE generated_images 
  ADD CONSTRAINT fk_generated_images_category_id 
  FOREIGN KEY (category_id) REFERENCES categories(id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

ALTER TABLE generated_images 
  ADD CONSTRAINT fk_generated_images_product_type_id 
  FOREIGN KEY (product_type_id) REFERENCES product_types(id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

ALTER TABLE generated_images 
  ADD CONSTRAINT fk_generated_images_product_pose_id 
  FOREIGN KEY (product_pose_id) REFERENCES product_poses(id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

ALTER TABLE generated_images 
  ADD CONSTRAINT fk_generated_images_product_theme_id 
  FOREIGN KEY (product_theme_id) REFERENCES product_themes(id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

ALTER TABLE generated_images 
  ADD CONSTRAINT fk_generated_images_product_background_id 
  FOREIGN KEY (product_background_id) REFERENCES product_backgrounds(id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

ALTER TABLE generated_images 
  ADD CONSTRAINT fk_generated_images_ai_face_id 
  FOREIGN KEY (ai_face_id) REFERENCES ai_faces(id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;
```

**Note:** RESTRICT prevents deletion of referenced entities if images exist. This protects data integrity.

#### TypeORM Entity Updates
```typescript
// Add relationships (TypeORM will create FK constraints)
@ManyToOne(() => Industry, { onDelete: 'RESTRICT' })
@JoinColumn({ name: 'industry_id' })
industry: Industry;

@ManyToOne(() => Category, { onDelete: 'RESTRICT' })
@JoinColumn({ name: 'category_id' })
category: Category;

// ... similar for other admin entities
```

---

### 2.3 UserBusiness FK Constraint

#### Current Issue
```typescript
// Current: userId has unique constraint but no FK constraint
@Column({ name: 'user_id', type: 'uuid', unique: true })
userId: string;
```

#### Fix Plan

```sql
-- Add FK constraint
ALTER TABLE user_businesses 
  ADD CONSTRAINT fk_user_businesses_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;
```

**Note:** CASCADE is correct - when user is deleted, business should be deleted too.

#### TypeORM Entity Update
```typescript
// Relationship already exists, but verify FK is created
@OneToOne(() => User, user => user.business, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'user_id' })
user: User;
```

---

### 2.4 ContactForm FK Constraint

#### Current Issue
```typescript
// Current: readBy has relationship but FK constraint may not exist
@Column({ name: 'read_by', type: 'uuid', nullable: true })
readBy?: string;
```

#### Fix Plan

```sql
-- Add FK constraint
ALTER TABLE contact_forms 
  ADD CONSTRAINT fk_contact_forms_read_by 
  FOREIGN KEY (read_by) REFERENCES users(id) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;
```

**Note:** SET NULL is correct - if admin user is deleted, keep the submission but clear readBy.

#### TypeORM Entity Update
```typescript
// Relationship exists, verify FK is created
@ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'read_by' })
readByUser?: User;
```

---

## 3. NOT NULL Constraints Improvements

### 3.1 GeneratedImage.userId

#### Decision Required
- **Option A:** Keep nullable (allows anonymous/future use cases)
- **Option B:** Make NOT NULL (requires userId for all generations)

**Recommendation:** Keep nullable but add FK constraint (Option A)

#### Implementation
```sql
-- If keeping nullable (recommended):
-- Just add FK constraint (see section 2.1)

-- If making NOT NULL:
-- 1. Update existing NULL values
UPDATE generated_images 
SET user_id = 'system-user-id' 
WHERE user_id IS NULL;

-- 2. Add NOT NULL constraint
ALTER TABLE generated_images 
  ALTER COLUMN user_id SET NOT NULL;

-- 3. Add FK constraint
ALTER TABLE generated_images 
  ADD CONSTRAINT fk_generated_images_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE RESTRICT;
```

---

### 3.2 ContactForm.email

#### Current Issue
Email should be NOT NULL (required field).

#### Fix Plan

```sql
-- Add NOT NULL constraint
ALTER TABLE contact_forms 
  ALTER COLUMN email SET NOT NULL;
```

#### TypeORM Entity Update
```typescript
@Column({ name: 'email', length: 150 })
email: string; // Remove nullable
```

---

### 3.3 UserAddress.userId

#### Current Issue
userId should be NOT NULL (FK should enforce).

#### Fix Plan

```sql
-- Add NOT NULL constraint
ALTER TABLE user_addresses 
  ALTER COLUMN user_id SET NOT NULL;
```

**Note:** FK constraint will be created by TypeORM relationship, but NOT NULL should be explicit.

#### TypeORM Entity Update
```typescript
@Column({ name: 'user_id', type: 'uuid' })
userId: string; // Already NOT NULL in code, verify in DB
```

---

## 4. Migration Strategy

### 4.1 Pre-Migration Checklist

- [ ] Backup production database
- [ ] Test all changes on staging
- [ ] Verify FK constraints don't break existing data
- [ ] Plan maintenance window (low traffic period)
- [ ] Prepare rollback plan

### 4.2 Migration Steps

#### Step 1: Add FK Constraints (Low Risk)
```sql
-- These can be added without downtime
-- Run during low traffic period

-- 1. GeneratedImage user FK
ALTER TABLE generated_images 
  ADD CONSTRAINT fk_generated_images_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE SET NULL;

-- 2. UserBusiness FK
ALTER TABLE user_businesses 
  ADD CONSTRAINT fk_user_businesses_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE CASCADE;

-- 3. ContactForm FK
ALTER TABLE contact_forms 
  ADD CONSTRAINT fk_contact_forms_read_by 
  FOREIGN KEY (read_by) REFERENCES users(id) 
  ON DELETE SET NULL;

-- 4. GeneratedImage admin FKs (add one at a time)
ALTER TABLE generated_images 
  ADD CONSTRAINT fk_generated_images_industry_id 
  FOREIGN KEY (industry_id) REFERENCES industries(id) 
  ON DELETE RESTRICT;
-- ... repeat for other admin FKs
```

#### Step 2: Add NOT NULL Constraints (Medium Risk)
```sql
-- Verify no NULL values exist first
SELECT COUNT(*) FROM contact_forms WHERE email IS NULL;
SELECT COUNT(*) FROM user_addresses WHERE user_id IS NULL;

-- If no NULLs, add constraints
ALTER TABLE contact_forms 
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE user_addresses 
  ALTER COLUMN user_id SET NOT NULL;
```

#### Step 3: Partitioning (High Risk - Requires Downtime)

**Option A: Zero-Downtime Migration (Recommended)**
```sql
-- 1. Create partitioned table alongside existing table
CREATE TABLE generated_images_new (
  LIKE generated_images INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 2. Create partitions
CREATE TABLE generated_images_new_2024_01 PARTITION OF generated_images_new
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- ... create all needed partitions

-- 3. Set up trigger to sync writes to both tables
CREATE OR REPLACE FUNCTION sync_generated_images()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO generated_images_new VALUES (NEW.*);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_generated_images_trigger
  AFTER INSERT ON generated_images
  FOR EACH ROW EXECUTE FUNCTION sync_generated_images();

-- 4. Migrate existing data (in batches)
INSERT INTO generated_images_new 
SELECT * FROM generated_images 
WHERE created_at >= '2024-01-01' 
LIMIT 10000;
-- Repeat until all data migrated

-- 5. Switch tables (atomic, requires brief lock)
BEGIN;
ALTER TABLE generated_images RENAME TO generated_images_old;
ALTER TABLE generated_images_new RENAME TO generated_images;
DROP TRIGGER sync_generated_images_trigger ON generated_images_old;
COMMIT;

-- 6. Verify and drop old table
-- DROP TABLE generated_images_old;
```

**Option B: Scheduled Downtime (Simpler)**
```sql
-- 1. Stop application writes
-- 2. Create partitioned table
-- 3. Migrate data
-- 4. Switch tables
-- 5. Restart application
```

---

### 4.3 Rollback Plan

#### If FK Constraints Fail
```sql
-- Remove FK constraints
ALTER TABLE generated_images 
  DROP CONSTRAINT IF EXISTS fk_generated_images_user_id;
-- ... repeat for all FKs
```

#### If Partitioning Fails
```sql
-- Switch back to old table
BEGIN;
ALTER TABLE generated_images RENAME TO generated_images_failed;
ALTER TABLE generated_images_old RENAME TO generated_images;
COMMIT;
```

---

## 5. Monitoring & Maintenance

### 5.1 Partition Monitoring

```sql
-- Monitor partition sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'generated_images_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor partition row counts
SELECT 
  schemaname,
  tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE tablename LIKE 'generated_images_%'
ORDER BY n_live_tup DESC;
```

### 5.2 Automated Partition Creation

```sql
-- Create function to create next month's partition
CREATE OR REPLACE FUNCTION create_monthly_partition(
  table_name TEXT,
  partition_date DATE
) RETURNS VOID AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  start_date := DATE_TRUNC('month', partition_date);
  end_date := start_date + INTERVAL '1 month';
  partition_name := table_name || '_' || TO_CHAR(start_date, 'YYYY_MM');
  
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    table_name,
    start_date,
    end_date
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule via cron (monthly):
-- SELECT create_monthly_partition('generated_images', CURRENT_DATE + INTERVAL '1 month');
-- SELECT create_monthly_partition('credit_transactions', CURRENT_DATE + INTERVAL '1 month');
```

### 5.3 Performance Monitoring

```sql
-- Monitor query performance on partitioned tables
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables
WHERE tablename IN ('generated_images', 'credit_transactions')
ORDER BY n_tup_ins DESC;
```

---

## 6. Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. ✅ Add FK constraints (low risk, can be done immediately)
2. ✅ Add NOT NULL constraints (verify data first)
3. ✅ Test on staging

### Phase 2: Partitioning Preparation (Week 2)
1. ✅ Create partitioning scripts
2. ✅ Test on staging with production-like data
3. ✅ Plan maintenance window
4. ✅ Backup production

### Phase 3: Partitioning Implementation (Week 3-4)
1. ✅ Implement GeneratedImage partitioning
2. ✅ Implement CreditTransaction partitioning
3. ✅ Set up automated partition creation
4. ✅ Monitor performance

### Phase 4: Optimization (Ongoing)
1. ✅ Monitor partition sizes
2. ✅ Archive old partitions quarterly
3. ✅ Optimize queries for partition pruning
4. ✅ Review and adjust partition strategy

---

## 7. Cost Impact

### Storage Savings
- **Partitioning:** Enables easier archiving (move old partitions to cold storage)
- **Compression:** Can compress old partitions
- **Estimated Savings:** 30-50% storage cost reduction after 1 year

### Performance Benefits
- **Query Speed:** 2-5x faster queries on recent data (partition pruning)
- **Maintenance:** Faster VACUUM and ANALYZE (per partition)
- **Scalability:** Can handle millions of rows efficiently

### Implementation Cost
- **Downtime:** 1-2 hours for partitioning (if using scheduled downtime)
- **Development:** 1-2 weeks for implementation and testing
- **Maintenance:** Minimal (automated partition creation)

---

## 8. Risks & Mitigation

### Risks
1. **Data Loss:** During migration
2. **Downtime:** During table switch
3. **Performance:** Queries not using partition pruning
4. **Maintenance:** Forgetting to create new partitions

### Mitigation
1. **Backup:** Full backup before any changes
2. **Testing:** Thorough testing on staging
3. **Monitoring:** Query performance monitoring
4. **Automation:** Automated partition creation (cron job)
5. **Rollback Plan:** Documented rollback procedures

---

**End of Plan**


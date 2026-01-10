# Frontend WebApp User Dashboard Statistics Integration Guide

## Overview

This document outlines the changes needed in the frontend to integrate the new `userDashboardStatistics` endpoint in the webapp. This endpoint provides comprehensive user dashboard statistics.

## API Endpoint

### New Endpoint

**Endpoint:**
```
GET /api/v1/webapp/userDashboardStatistics
```

**Authentication:**
- Requires Bearer token (JWT)
- Requires USER role

**Note:** The existing `/webapp/systemdata` endpoint remains unchanged and continues to work.

## Response Structure

### System Statistics Response

```typescript
{
  success: true,
  message: "System statistics retrieved successfully",
  data: {
    generations: {
      usersWithSingleGeneration: number,      // Users who used single generation
      usersWithBulkGeneration: number,         // Users who used bulk generation
      totalImageGenerations: number           // Total successful image generations
    },
    system: {
      aiFaces: number,
      backgrounds: number,
      poses: number,
      categories: number,
      industries: number,
      themes: number
    },
    general: {
      totalCredits: number,                    // Total credits distributed
      remainingCredits: number,                // Total remaining credits across all users
      usedCredits: number,                     // Total credits used
      totalGeneratedImagePurchasedCredit: number,  // Dummy: 0 (for future payment integration)
      totalPaidAmount: number                  // Dummy: 0 (for future payment integration)
    }
  }
}
```

## Frontend Implementation Steps

### Step 1: Update API Service

**File:** `src/services/api/webappApi.ts` (or similar)

```typescript
// Existing endpoint (unchanged)
export const getSystemData = async (): Promise<SystemDataResponse> => {
  const response = await api.get('/webapp/systemdata');
  return response.data;
};

// New endpoint
export const getUserDashboardStatistics = async (): Promise<SystemStatisticsResponse> => {
  const response = await api.get('/webapp/userDashboardStatistics');
  return response.data;
};
```

### Step 2: Create TypeScript Types

**File:** `src/types/webapp/systemStatistics.ts`

```typescript
export interface GenerationsStatistics {
  usersWithSingleGeneration: number;
  usersWithBulkGeneration: number;
  totalImageGenerations: number;
}

export interface SystemData {
  aiFaces: number;
  backgrounds: number;
  poses: number;
  categories: number;
  industries: number;
  themes: number;
}

export interface GeneralStatistics {
  totalCredits: number;
  remainingCredits: number;
  usedCredits: number;
  totalGeneratedImagePurchasedCredit: number; // Dummy: 0
  totalPaidAmount: number; // Dummy: 0
}

export interface SystemStatisticsResponse {
  generations: GenerationsStatistics;
  system: SystemData;
  general: GeneralStatistics;
}
```

### Step 3: Update Components

**File:** `src/components/dashboard/SystemStatistics.tsx` (or similar)

```typescript
import { useEffect, useState } from 'react';
import { getUserDashboardStatistics, SystemStatisticsResponse } from '@/services/api/webappApi';

const UserDashboardStatistics = () => {
  const [stats, setStats] = useState<SystemStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getUserDashboardStatistics();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch user dashboard statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="system-statistics">
      {/* Generations Section */}
      <section className="generations-stats">
        <h2>Generation Statistics</h2>
        <div className="stats-grid">
          <StatCard
            title="Users with Single Generation"
            value={stats.generations.usersWithSingleGeneration}
          />
          <StatCard
            title="Users with Bulk Generation"
            value={stats.generations.usersWithBulkGeneration}
          />
          <StatCard
            title="Total Image Generations"
            value={stats.generations.totalImageGenerations}
          />
        </div>
      </section>

      {/* System Section */}
      <section className="system-stats">
        <h2>System Statistics</h2>
        <div className="stats-grid">
          <StatCard label="AI Faces" value={stats.system.aiFaces} />
          <StatCard label="Backgrounds" value={stats.system.backgrounds} />
          <StatCard label="Poses" value={stats.system.poses} />
          <StatCard label="Categories" value={stats.system.categories} />
          <StatCard label="Industries" value={stats.system.industries} />
          <StatCard label="Themes" value={stats.system.themes} />
        </div>
      </section>

      {/* General Section */}
      <section className="general-stats">
        <h2>General Statistics</h2>
        <div className="stats-grid">
          <StatCard title="Total Credits" value={stats.general.totalCredits} />
          <StatCard title="Remaining Credits" value={stats.general.remainingCredits} />
          <StatCard title="Used Credits" value={stats.general.usedCredits} />
          <StatCard
            title="Purchased Credits"
            value={stats.general.totalGeneratedImagePurchasedCredit}
            note="Dummy value - Payment integration pending"
          />
          <StatCard
            title="Total Paid Amount"
            value={`$${stats.general.totalPaidAmount.toFixed(2)}`}
            note="Dummy value - Payment integration pending"
          />
        </div>
      </section>
    </div>
  );
};
```

## Migration Checklist

- [ ] Add new API service method for `getUserDashboardStatistics`
- [ ] Create TypeScript types for new response structure
- [ ] Update dashboard component to use new endpoint (or create new component)
- [ ] Test the new endpoint integration
- [ ] Handle dummy payment values appropriately (show placeholder or hide)
- [ ] Update error handling for new endpoint
- [ ] Add loading states

## Testing

1. **Test the new endpoint:**
   ```bash
   curl -X GET "http://localhost:8080/api/v1/webapp/userDashboardStatistics" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Verify response structure matches TypeScript types**

3. **Test error handling (unauthorized, network errors, etc.)**

## Notes

- The existing `/webapp/systemdata` endpoint remains unchanged
- The new `/webapp/userDashboardStatistics` endpoint provides comprehensive user dashboard statistics
- Payment-related fields (`totalGeneratedImagePurchasedCredit`, `totalPaidAmount`) are currently dummy values (0) and will be populated when payment integration is complete
- Endpoint requires USER role authentication

## Future Updates

When payment integration is complete:
1. Remove dummy value handling
2. Update TypeScript types if payment structure changes
3. Add payment-specific UI components
4. Update documentation


# Admin Panel Update Guide: Product Pose Multiple Product Types

## Overview

The backend has been updated to support **multiple product types per product pose** (ManyToMany relationship). This guide explains the changes needed in the admin panel frontend.

---

## 🔄 What Changed

### Before
- A product pose could only belong to **one product type**
- API used `productTypeId: string` (single value)
- Response included `productType: ProductType` (single object)

### After
- A product pose can belong to **multiple product types**
- API uses `productTypeIds: string[]` (array of IDs)
- Response includes `productTypes: ProductType[]` (array of objects)

---

## 📡 API Changes

### 1. Create Product Pose

**Endpoint:** `POST /admin/product-poses`

**Request Body (multipart/form-data):**
```typescript
// OLD ❌
{
  name: string;
  description?: string;
  image: File;
  productTypeId: string;  // Single ID
  productBackgroundIds?: string[];
}

// NEW ✅
{
  name: string;
  description?: string;
  image: File;
  productTypeIds: string[];  // Array of IDs (required)
  productBackgroundIds?: string[];
}
```

**Example (FormData):**
```javascript
const formData = new FormData();
formData.append('name', 'Look-Left');
formData.append('description', 'Shoulders down, head tilted left');
formData.append('image', file);
formData.append('productTypeIds', JSON.stringify(['uuid1', 'uuid2'])); // JSON string
// OR
formData.append('productTypeIds', 'uuid1,uuid2'); // Comma-separated
// OR (if your library supports arrays)
formData.append('productTypeIds[]', 'uuid1');
formData.append('productTypeIds[]', 'uuid2');
```

---

### 2. Update Product Pose

**Endpoint:** `PUT /admin/product-poses/:id`

**Request Body (multipart/form-data):**
```typescript
// OLD ❌
{
  name?: string;
  description?: string;
  image?: File;
  productTypeId?: string;  // Single ID (optional)
  productBackgroundIds?: string[];
}

// NEW ✅
{
  name?: string;
  description?: string;
  image?: File;
  productTypeIds?: string[];  // Array of IDs (optional)
  productBackgroundIds?: string[];
}
```

---

### 3. Get Product Pose

**Endpoint:** `GET /admin/product-poses/:id`

**Response:**
```typescript
// OLD ❌
{
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productType: {  // Single object
    id: string;
    name: string;
    category: { ... }
  };
  productBackgrounds: ProductBackground[];
  // ...
}

// NEW ✅
{
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productTypes: [  // Array of objects
    {
      id: string;
      name: string;
      category: { ... }
    },
    // ... more product types
  ];
  productBackgrounds: ProductBackground[];
  // ...
}
```

---

### 4. List Product Poses

**Endpoint:** `GET /admin/product-poses`

**Query Parameters:** (unchanged)
- `productTypeId?: string` - Filter by product type (returns poses that have this type)
- `search?: string`
- `page?: number`
- `limit?: number`
- `sortBy?: string`
- `sortOrder?: 'ASC' | 'DESC'`
- `includeDeleted?: boolean`

**Response:**
```typescript
{
  data: ProductPose[];  // Each pose has productTypes: ProductType[]
  page: number;
  limit: number;
  total: number;
  message: string;
}
```

---

## 🎨 Frontend Implementation Guide

### 1. Update TypeScript Interfaces

```typescript
// types/product-pose.types.ts

// OLD ❌
interface ProductPose {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productType: ProductType;  // Single
  productBackgrounds: ProductBackground[];
  createdAt: string;
  updatedAt: string;
}

// NEW ✅
interface ProductPose {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productTypes: ProductType[];  // Array
  productBackgrounds: ProductBackground[];
  createdAt: string;
  updatedAt: string;
}

// DTOs
interface CreateProductPoseDto {
  name: string;
  description?: string;
  image: File;
  productTypeIds: string[];  // Changed from productTypeId: string
  productBackgroundIds?: string[];
}

interface UpdateProductPoseDto {
  name?: string;
  description?: string;
  image?: File;
  productTypeIds?: string[];  // Changed from productTypeId?: string
  productBackgroundIds?: string[];
}
```

---

### 2. Update Create Form Component

```typescript
// components/admin/product-poses/CreateProductPoseForm.tsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormData {
  name: string;
  description?: string;
  productTypeIds: string[];  // Changed from productTypeId
  productBackgroundIds?: string[];
}

export function CreateProductPoseForm() {
  const [selectedProductTypeIds, setSelectedProductTypeIds] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) {
      formData.append('description', data.description);
    }
    
    // ✅ Send as JSON string (recommended)
    formData.append('productTypeIds', JSON.stringify(selectedProductTypeIds));
    
    // OR send as comma-separated string
    // formData.append('productTypeIds', selectedProductTypeIds.join(','));
    
    if (data.productBackgroundIds?.length) {
      formData.append('productBackgroundIds', JSON.stringify(data.productBackgroundIds));
    }
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch('/api/admin/product-poses', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to create product pose');
      
      const result = await response.json();
      console.log('Created:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name', { required: true })} />
      
      {/* ✅ Multi-select for product types */}
      <select
        multiple
        value={selectedProductTypeIds}
        onChange={(e) => {
          const values = Array.from(e.target.selectedOptions, option => option.value);
          setSelectedProductTypeIds(values);
        }}
        required
      >
        {productTypes.map(type => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
      
      {/* OR use a multi-select component */}
      <MultiSelect
        options={productTypes}
        value={selectedProductTypeIds}
        onChange={setSelectedProductTypeIds}
        getOptionLabel={(type) => type.name}
        getOptionValue={(type) => type.id}
        placeholder="Select product types..."
      />
      
      {selectedProductTypeIds.length === 0 && (
        <span className="error">At least one product type is required</span>
      )}
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        required
      />
      
      <button type="submit">Create</button>
    </form>
  );
}
```

---

### 3. Update Edit Form Component

```typescript
// components/admin/product-poses/EditProductPoseForm.tsx

export function EditProductPoseForm({ pose }: { pose: ProductPose }) {
  const [selectedProductTypeIds, setSelectedProductTypeIds] = useState<string[]>(
    pose.productTypes.map(pt => pt.id)  // ✅ Initialize with existing types
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const onSubmit = async (data: FormData) => {
    const formData = new FormData();
    formData.append('name', data.name);
    
    // ✅ Only send if changed
    if (JSON.stringify(selectedProductTypeIds.sort()) !== 
        JSON.stringify(pose.productTypes.map(pt => pt.id).sort())) {
      formData.append('productTypeIds', JSON.stringify(selectedProductTypeIds));
    }
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    await fetch(`/api/admin/product-poses/${pose.id}`, {
      method: 'PUT',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Multi-select with existing values pre-selected */}
      <MultiSelect
        options={productTypes}
        value={selectedProductTypeIds}
        onChange={setSelectedProductTypeIds}
        getOptionLabel={(type) => type.name}
        getOptionValue={(type) => type.id}
      />
      
      {/* Display current product types */}
      <div>
        <strong>Current Product Types:</strong>
        {pose.productTypes.map(pt => (
          <span key={pt.id} className="badge">
            {pt.name}
          </span>
        ))}
      </div>
      
      {/* Rest of form... */}
    </form>
  );
}
```

---

### 4. Update Display Components

```typescript
// components/admin/product-poses/ProductPoseCard.tsx

// OLD ❌
function ProductPoseCard({ pose }: { pose: ProductPose }) {
  return (
    <div>
      <h3>{pose.name}</h3>
      <p>Product Type: {pose.productType.name}</p>  // ❌ Single type
      <p>Category: {pose.productType.category.name}</p>
    </div>
  );
}

// NEW ✅
function ProductPoseCard({ pose }: { pose: ProductPose }) {
  return (
    <div>
      <h3>{pose.name}</h3>
      <div>
        <strong>Product Types:</strong>
        {pose.productTypes.map(type => (
          <span key={type.id} className="badge">
            {type.name}
          </span>
        ))}
      </div>
      <div>
        <strong>Categories:</strong>
        {[...new Set(pose.productTypes.map(pt => pt.category.name))].join(', ')}
      </div>
    </div>
  );
}
```

---

### 5. Update Table/List View

```typescript
// components/admin/product-poses/ProductPosesTable.tsx

function ProductPosesTable({ poses }: { poses: ProductPose[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Product Types</th>  {/* Changed from "Product Type" */}
          <th>Backgrounds</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {poses.map(pose => (
          <tr key={pose.id}>
            <td>{pose.name}</td>
            <td>
              {/* ✅ Display multiple types */}
              <div className="tags">
                {pose.productTypes.map(type => (
                  <span key={type.id} className="tag">
                    {type.name}
                  </span>
                ))}
              </div>
            </td>
            <td>
              {pose.productBackgrounds.map(bg => (
                <span key={bg.id} className="tag">{bg.name}</span>
              ))}
            </td>
            <td>
              <button onClick={() => handleEdit(pose.id)}>Edit</button>
              <button onClick={() => handleDelete(pose.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

### 6. Update Filter Component

```typescript
// components/admin/product-poses/ProductPoseFilters.tsx

// Filter still works the same way - it filters poses that have the selected product type
function ProductPoseFilters({ onFilter }: { onFilter: (filters: any) => void }) {
  const [productTypeId, setProductTypeId] = useState<string>('');

  const handleFilter = () => {
    onFilter({
      productTypeId: productTypeId || undefined,  // Still single ID for filtering
      // ... other filters
    });
  };

  return (
    <div>
      <select
        value={productTypeId}
        onChange={(e) => setProductTypeId(e.target.value)}
      >
        <option value="">All Product Types</option>
        {productTypes.map(type => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
      <button onClick={handleFilter}>Filter</button>
    </div>
  );
}
```

---

## 🔧 Utility Functions

```typescript
// utils/product-pose.utils.ts

/**
 * Format product type IDs for FormData
 */
export function formatProductTypeIdsForFormData(ids: string[]): string {
  return JSON.stringify(ids);
}

/**
 * Parse product type IDs from FormData (if needed)
 */
export function parseProductTypeIdsFromFormData(value: string | string[]): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      // Fallback: comma-separated
      return value.split(',').map(id => id.trim()).filter(Boolean);
    }
  }
  return [];
}

/**
 * Get display text for product types
 */
export function getProductTypesDisplay(types: ProductType[]): string {
  if (types.length === 0) return 'No product types';
  if (types.length === 1) return types[0].name;
  return `${types.length} types: ${types.map(t => t.name).join(', ')}`;
}
```

---

## ✅ Checklist for Frontend Updates

- [ ] Update TypeScript interfaces (`ProductPose`, DTOs)
- [ ] Update create form to use multi-select for product types
- [ ] Update edit form to handle array of product types
- [ ] Update display components to show multiple product types
- [ ] Update table/list views to display product types as tags/badges
- [ ] Update API service functions to send `productTypeIds` array
- [ ] Update response handling to use `productTypes` array
- [ ] Test create with single product type
- [ ] Test create with multiple product types
- [ ] Test edit to add/remove product types
- [ ] Test filtering (should still work)
- [ ] Update any validation messages
- [ ] Update any help text/documentation

---

## 🐛 Common Issues & Solutions

### Issue 1: FormData not sending array correctly
**Solution:** Send as JSON string:
```typescript
formData.append('productTypeIds', JSON.stringify(ids));
```

### Issue 2: Backend returns 400 "At least one product type ID is required"
**Solution:** Ensure you're sending an array, not a single value:
```typescript
// ❌ Wrong
formData.append('productTypeIds', singleId);

// ✅ Correct
formData.append('productTypeIds', JSON.stringify([singleId]));
```

### Issue 3: Display shows undefined for productType
**Solution:** Update to use `productTypes` array:
```typescript
// ❌ Old
{pose.productType?.name}

// ✅ New
{pose.productTypes?.map(t => t.name).join(', ')}
```

---

## 📝 Example: Complete Form Component

```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MultiSelect } from 'your-ui-library';

interface CreateProductPoseFormData {
  name: string;
  description?: string;
  productTypeIds: string[];
  productBackgroundIds?: string[];
}

export function CreateProductPoseForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateProductPoseFormData>();
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [selectedBackgroundIds, setSelectedBackgroundIds] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: CreateProductPoseFormData) => {
    if (selectedTypeIds.length === 0) {
      alert('Please select at least one product type');
      return;
    }

    if (!imageFile) {
      alert('Please select an image');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) {
        formData.append('description', data.description);
      }
      formData.append('productTypeIds', JSON.stringify(selectedTypeIds));
      if (selectedBackgroundIds.length > 0) {
        formData.append('productBackgroundIds', JSON.stringify(selectedBackgroundIds));
      }
      formData.append('image', imageFile);

      const response = await fetch('/api/admin/product-poses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product pose');
      }

      const result = await response.json();
      console.log('Success:', result);
      // Redirect or show success message
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Name *</label>
        <input {...register('name', { required: true })} />
        {errors.name && <span>Name is required</span>}
      </div>

      <div>
        <label>Description</label>
        <textarea {...register('description')} />
      </div>

      <div>
        <label>Product Types *</label>
        <MultiSelect
          options={productTypes}
          value={selectedTypeIds}
          onChange={setSelectedTypeIds}
          getOptionLabel={(type) => type.name}
          getOptionValue={(type) => type.id}
          placeholder="Select product types..."
          isMulti
        />
        {selectedTypeIds.length === 0 && (
          <span className="error">At least one product type is required</span>
        )}
      </div>

      <div>
        <label>Product Backgrounds</label>
        <MultiSelect
          options={productBackgrounds}
          value={selectedBackgroundIds}
          onChange={setSelectedBackgroundIds}
          getOptionLabel={(bg) => bg.name}
          getOptionValue={(bg) => bg.id}
          placeholder="Select backgrounds..."
          isMulti
        />
      </div>

      <div>
        <label>Image *</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Product Pose'}
      </button>
    </form>
  );
}
```

---

## 🚀 Migration Notes

1. **Backward Compatibility:** The filter endpoint still accepts `productTypeId` (singular) for filtering
2. **Database:** The backend will automatically migrate the database schema
3. **Existing Data:** Existing product poses with a single product type will need to be updated through the admin panel
4. **API Versioning:** Consider versioning your API if you need to support old clients temporarily

---

## 📚 Additional Resources

- Backend API Documentation: Check Swagger/OpenAPI docs at `/api/docs`
- TypeScript Types: Import from your shared types package
- Testing: Update unit tests and integration tests to use arrays

---

**Last Updated:** 2026-01-10  
**Backend Version:** Updated to support ManyToMany ProductPose ↔ ProductType relationship



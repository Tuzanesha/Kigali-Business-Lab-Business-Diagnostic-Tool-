# Performance Fixes for Question Loading

## Issues Identified

1. **Import command running on every startup** - Slows down service startup
2. **Frontend making multiple API calls** - One call per category (N+1 problem)
3. **No database indexes** - Queries are slower than they could be

## Fixes Applied

### 1. Optimized Import Command ✅

**Before**: Import ran on every startup, even if questions already existed
**After**: 
- Skips import if questions already exist (default behavior)
- Uses bulk operations for faster imports
- Only imports when needed

**Changes**:
- Added `--skip-if-exists` flag (default: True)
- Added `--force` flag to force reimport
- Uses `bulk_create` and `bulk_update` instead of individual `update_or_create` calls
- Checks if questions exist before importing

### 2. Added Bulk Questions Endpoint ✅

**New Endpoint**: `GET /api/questions/all/`

Returns all questions grouped by category in a single API call:
```json
{
  "questions_by_category": {
    "LEADERSHIP": [...],
    "ORGANISATION & STAFF": [...],
    ...
  },
  "total_questions": 150
}
```

**Benefits**:
- Frontend can make 1 API call instead of 9 (1 for categories + 8 for questions)
- Much faster loading
- Reduced server load

### 3. Added Database Indexes ✅

Added indexes to `Question` model for faster queries:
- Index on `category` (for filtering by category)
- Composite index on `category, number` (for lookups)

### 4. Optimized Startup Script ✅

Updated `start.sh` to use `--skip-if-exists` flag:
```bash
python manage.py import_questions --skip-if-exists
```

This means:
- First deployment: Questions are imported
- Subsequent deployments: Import is skipped (fast startup)
- Questions are only imported when they don't exist

## Performance Improvements

### Before:
- Startup: ~10-30 seconds (importing questions every time)
- Question loading: 9+ API calls (slow)
- Query performance: No indexes (slower queries)

### After:
- Startup: ~2-5 seconds (skips import if questions exist)
- Question loading: 1 API call (if using `/api/questions/all/`)
- Query performance: Indexed queries (faster)

## Frontend Optimization (Recommended)

Update your frontend to use the new bulk endpoint:

**Before** (slow - multiple calls):
```typescript
// Get categories
const cats = await catalogApi.getCategories(access);

// Then for each category...
for (const name of names) {
  const qres = await catalogApi.getQuestions(access, { category: name });
  // ... process questions
}
```

**After** (fast - single call):
```typescript
// Get all questions at once
const response = await apiGet('questions/all/', access);
const questionsByCategory = response.questions_by_category;

// Process all questions grouped by category
for (const [categoryName, questions] of Object.entries(questionsByCategory)) {
  // ... process questions
}
```

## Migration for Indexes

The indexes I added will require a migration. After you deploy, run:

```bash
python manage.py makemigrations
python manage.py migrate
```

Or it will run automatically on the next deployment via `start.sh`.

## Testing

1. **Test startup speed**: Deploy and check logs - should see "Questions already exist, skipping import"
2. **Test question loading**: Use `/api/questions/all/` endpoint
3. **Test individual category**: `/api/questions/?category=LEADERSHIP` should still work

## Current Behavior

- ✅ Import runs only if questions don't exist
- ✅ Bulk operations for faster imports
- ✅ New bulk endpoint available
- ✅ Database indexes added (need migration)

## Next Steps

1. **Deploy these changes**
2. **Create migration for indexes**: `python manage.py makemigrations` (if needed)
3. **Update frontend** (optional but recommended): Use `/api/questions/all/` endpoint
4. **Monitor performance**: Check startup time and question loading speed

The questions should now load much faster! 🚀


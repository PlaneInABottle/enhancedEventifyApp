# Content Reporting System

## Overview
The content reporting system allows users to report inappropriate events, venues, businesses, or other users for moderation review.

## Database Schema

### content_reports Table
```sql
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  content_type content_type NOT NULL,  -- 'event', 'venue', 'business', 'user'
  content_id UUID NOT NULL,
  reason report_reason NOT NULL,       -- 'inappropriate_content', 'spam', 'misleading', 'offensive', 'other'
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',  -- 'pending', 'reviewing', 'resolved', 'dismissed'
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Enums
- `content_type`: event | venue | business | user
- `report_reason`: inappropriate_content | spam | misleading | offensive | other  
- `report_status`: pending | reviewing | resolved | dismissed

## Implementation

### Components
- **ReportButton**: Integrates into content components (EventCard, EventListModal)
- **ReportModal**: Full-screen modal for selecting reason and providing description

### Features
- ✅ Authentication required
- ✅ Duplicate report prevention (PostgreSQL constraint)
- ✅ Input validation (10-500 characters for "other" descriptions)
- ✅ Bilingual support (EN/TR)
- ✅ Accessibility compliant
- ✅ Comprehensive error handling

### Security
- Row Level Security (RLS) policies restrict access
- Users can only see their own reports
- Moderators can see all reports for review
- Input sanitization prevents XSS attacks

## Usage

```typescript
// In any content component
<ReportButton 
  contentType="event" 
  contentId={event.id} 
/>
```

## Testing
- Complete test coverage for both components
- Mocked Supabase integration
- Async behavior testing
- Error scenario coverage
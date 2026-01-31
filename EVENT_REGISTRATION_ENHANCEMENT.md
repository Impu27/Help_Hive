# Event Registration Enhancement - Semester & USN Collection

## Summary
Enhanced the event registration system to collect semester and USN (University Serial Number) from students during event registration. Both fields are required and validated on the frontend and backend.

---

## Changes Made

### 1. **Backend - Registration Model** ✅
**File:** [backend/models/Registration.js](backend/models/Registration.js)

**Added Fields:**
- `semester` - Number field (required, min: 1, max: 8)
- `usn` - String field (required, uppercase letters and numbers only)

```javascript
semester: {
  type: Number,
  required: [true, 'Semester is required'],
  min: [1, 'Semester must be between 1 and 8'],
  max: [8, 'Semester must be between 1 and 8']
},
usn: {
  type: String,
  required: [true, 'USN is required'],
  trim: true,
  match: [/^[A-Z0-9]+$/, 'USN must contain only uppercase letters and numbers']
}
```

---

### 2. **Backend - Registration API** ✅
**File:** [backend/routes/registrations.js](backend/routes/registrations.js)

**Updated `/api/registrations/register` endpoint:**

**Request Body Changes:**
```javascript
// Before
{ eventId }

// After
{ eventId, semester, usn }
```

**Validation Logic Added:**
- Checks if semester and USN are provided
- Validates semester is between 1-8
- Validates USN contains only uppercase letters and numbers
- Returns appropriate error messages for each validation failure

**Preserved Logic:**
- Event existence check
- Event capacity check
- Duplicate registration prevention
- Event participant count increment
- JWT authentication & student-only access

---

### 3. **Frontend - Registration Interface** ✅
**File:** [frontend/src/app/models/interfaces.ts](frontend/src/app/models/interfaces.ts)

**Added Registration Interface:**
```typescript
export interface Registration {
  _id: string;
  student: User | string;
  event: Event | string;
  semester: number;
  usn: string;
  status: 'registered' | 'attended' | 'cancelled';
  registrationDate: Date;
}
```

---

### 4. **Frontend - API Service** ✅
**File:** [frontend/src/app/services/api.service.ts](frontend/src/app/services/api.service.ts)

**Updated `registerForEvent` method:**

```typescript
// Before
registerForEvent(eventId: string): Observable<any>

// After
registerForEvent(eventId: string, semester: number, usn: string): Observable<any>
```

Now sends semester and USN in request payload:
```typescript
{ eventId, semester, usn }
```

---

### 5. **Frontend - Event List Component** ✅
**File:** [frontend/src/app/student/event-list/event-list.ts](frontend/src/app/student/event-list/event-list.ts)

**New Component State:**
```typescript
showRegistrationModal = false;

registrationForm = {
  semester: '',
  usn: ''
};
registrationError = '';
```

**New Methods:**
1. `registerForEvent(eventId)` - Opens registration modal instead of direct registration
2. `closeRegistrationModal()` - Closes modal and clears form
3. `submitRegistration()` - Validates form and submits registration
4. `validateRegistrationForm()` - Client-side validation

**Validation Logic:**
- Required field checks
- Semester range validation (1-8)
- USN format validation (uppercase letters and numbers only)
- Proper error messaging

**Preserved Logic:**
- Modal state management
- Loading states
- Error handling
- Event list filtering
- Submission tracking
- Change detection

---

### 6. **Frontend - Event List Template** ✅
**File:** [frontend/src/app/student/event-list/event-list.html](frontend/src/app/student/event-list/event-list.html)

**New Registration Modal Added:**

Modal includes:
- Modal overlay with close button
- Event title display
- Error message display
- Semester dropdown (1-8)
- USN text input with placeholder and help text
- Cancel and Register buttons with loading state

```html
<!-- ================= REGISTRATION MODAL ================= -->
<div class="modal-overlay" *ngIf="showRegistrationModal" (click)="closeRegistrationModal()">
  <div class="modal-content" (click)="$event.stopPropagation()">
    <!-- Modal content -->
  </div>
</div>
```

---

## User Experience Flow

```
1. User clicks "Register" button on event card
   ↓
2. Registration modal opens with event title
   ↓
3. User selects semester (1-8) from dropdown
   ↓
4. User enters USN (e.g., 1BM20CS001)
   ↓
5. User clicks Register button
   ↓
6. Frontend validates inputs
   - If invalid → Display error message
   - If valid → Proceed to backend
   ↓
7. Backend validates and creates registration
   - If invalid → Return error
   - If valid → Create registration with semester & USN
   ↓
8. Modal closes
9. Event marked as registered
10. Event participant count increments
```

---

## Validation Rules

### Semester
- **Type:** Number
- **Range:** 1-8 (inclusive)
- **Required:** Yes
- **Error Messages:**
  - "Semester is required"
  - "Semester must be between 1 and 8"

### USN (University Serial Number)
- **Type:** String
- **Format:** Uppercase letters and numbers only
- **Required:** Yes
- **Examples:** 1BM20CS001, 1BM19ME045, BT2020004
- **Invalid Examples:** 1bm20cs001 (lowercase), 1BM-20CS-001 (special chars)
- **Error Messages:**
  - "USN is required"
  - "USN must contain only uppercase letters and numbers"

---

## API Endpoint

### POST `/api/registrations/register`

**Request:**
```json
{
  "eventId": "507f1f77bcf86cd799439011",
  "semester": 5,
  "usn": "1BM20CS001"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Successfully registered for event",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "student": "507f1f77bcf86cd799439001",
    "event": "507f1f77bcf86cd799439011",
    "semester": 5,
    "usn": "1BM20CS001",
    "status": "registered",
    "registrationDate": "2024-01-31T10:30:00.000Z"
  }
}
```

**Error Responses (400/404/500):**
```json
{
  "success": false,
  "message": "Semester must be between 1 and 8"
}
```

---

## Database Schema Changes

**Before:**
```javascript
{
  student: ObjectId,
  event: ObjectId,
  status: String,
  registrationDate: Date,
  timestamps: true
}
```

**After:**
```javascript
{
  student: ObjectId,
  event: ObjectId,
  semester: Number,        // NEW
  usn: String,            // NEW
  status: String,
  registrationDate: Date,
  timestamps: true
}
```

---

## Preserved Features

✅ Event capacity checking
✅ Duplicate registration prevention
✅ Authentication & authorization
✅ Event participant count tracking
✅ Submission tracking
✅ Event filtering and search
✅ Modal UI flow
✅ Error handling
✅ Loading states
✅ Change detection

---

## Testing Checklist

- [ ] Register with valid semester (1-8) and USN format
- [ ] Try to register with semester 0 → Show error "Semester must be between 1 and 8"
- [ ] Try to register with semester 9 → Show error "Semester must be between 1 and 8"
- [ ] Try to register with lowercase USN → Show error (auto-converts to uppercase)
- [ ] Try to register with special characters in USN → Show error
- [ ] Leave semester blank → Show error "Semester and USN are required"
- [ ] Leave USN blank → Show error "Semester and USN are required"
- [ ] Register for event → Modal closes, event shows as registered
- [ ] Verify registration data in database has semester and USN
- [ ] Try duplicate registration → Show "You are already registered for this event"
- [ ] Try to register for full event → Show "Event is full"

---

## No Changes Made To

- Student dashboard
- Event list display (cards remain the same)
- Event details modal
- Submission modal
- Event creation (admin)
- Event filtering
- Points tracking
- User authentication
- Event cancellation logic

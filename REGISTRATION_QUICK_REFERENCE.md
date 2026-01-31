# Quick Reference: Event Registration with Semester & USN

## Implementation Summary

Modified event registration system to collect and validate **Semester** (1-8) and **USN** (alphanumeric) during student registration.

---

## Files Modified

| File | Changes |
|------|---------|
| `backend/models/Registration.js` | Added `semester` and `usn` fields with validation |
| `backend/routes/registrations.js` | Updated register endpoint to accept/validate semester & USN |
| `frontend/src/app/models/interfaces.ts` | Added `Registration` interface |
| `frontend/src/app/services/api.service.ts` | Updated `registerForEvent()` to send semester & USN |
| `frontend/src/app/student/event-list/event-list.ts` | Added registration form logic and validation |
| `frontend/src/app/student/event-list/event-list.html` | Added registration modal UI |

---

## Key Features

✅ **Modal-based Registration Form** - Opens when user clicks "Register"
✅ **Semester Dropdown** - Options 1-8
✅ **USN Input** - Validates uppercase letters/numbers
✅ **Client-side Validation** - Instant feedback
✅ **Server-side Validation** - Double-check safety
✅ **Error Messages** - Clear, actionable feedback
✅ **Preserved Logic** - All existing features intact

---

## Registration Flow

```
User clicks "Register" 
  → Modal opens with Semester dropdown & USN field
  → User selects semester & enters USN
  → User clicks "Register" button
  → Frontend validates inputs
  → Backend validates & stores registration
  → Modal closes & event marked as registered
```

---

## Validation Rules

**Semester:**
- Required
- Integer 1-8
- Dropdown selection (no invalid entries possible)

**USN:**
- Required
- Uppercase letters A-Z and numbers 0-9 only
- Examples: `1BM20CS001`, `2CS19ME045`, `3IT20002`
- Invalid: `1bm20cs001` (lowercase), `1BM-20-CS-001` (special chars)

---

## Backend Validation Response

**Valid Request:**
```
POST /api/registrations/register
{
  eventId: "...",
  semester: 5,
  usn: "1BM20CS001"
}
Response: 201 Created
```

**Invalid Semester:**
```
Response: 400 Bad Request
Message: "Semester must be between 1 and 8"
```

**Invalid USN:**
```
Response: 400 Bad Request
Message: "USN must contain only uppercase letters and numbers"
```

**Already Registered:**
```
Response: 400 Bad Request
Message: "You are already registered for this event"
```

---

## Form State Management

In `event-list.ts` component:
- `showRegistrationModal` - Modal visibility
- `registrationForm` - Form data (semester, usn)
- `registrationError` - Error message display
- `registering` - Set of event IDs being registered for (loading state)

---

## Example Usage

### Frontend Registration Call
```typescript
// From event-list.ts
this.apiService.registerForEvent(
  eventId,           // string
  5,                 // semester: number
  "1BM20CS001"      // usn: string
).subscribe(...)
```

### API Call
```bash
curl -X POST http://localhost:5000/api/registrations/register \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "507f1f77bcf86cd799439011",
    "semester": 5,
    "usn": "1BM20CS001"
  }'
```

---

## Database Query

**Find registrations with specific semester:**
```javascript
db.registrations.find({ semester: 5 })
```

**Find registrations by USN:**
```javascript
db.registrations.find({ usn: "1BM20CS001" })
```

**List all registrations for an event with semester info:**
```javascript
db.registrations.find({ event: ObjectId("...") }, { semester: 1, usn: 1 })
```

---

## No Breaking Changes

✅ Existing registration cancellation works
✅ Event capacity checking unchanged
✅ Duplicate registration prevention unchanged
✅ Event list filtering unchanged
✅ Admin dashboard unchanged
✅ Submission flow unchanged
✅ Points tracking unchanged

---

## Testing Tips

1. **Valid Registration:** Semester 3, USN: 1BM20CS001
2. **Invalid Semester:** Try 0 or 9 → Error message
3. **Invalid USN:** Try lowercase → Error message
4. **Duplicate:** Try registering twice → Error message
5. **Database Check:** View registration to confirm semester/USN stored

---

## Error Messages (User-Friendly)

| Scenario | Message |
|----------|---------|
| Missing Semester/USN | "Semester and USN are required" |
| Semester < 1 or > 8 | "Semester must be between 1 and 8" |
| Invalid USN format | "USN must contain only uppercase letters and numbers" |
| Already registered | "You are already registered for this event" |
| Event full | "Event is full. No more spots available." |

---

## Support Notes

- USN automatically converted to uppercase before sending to server
- Semester is selected from dropdown (no invalid input possible)
- Form closes automatically on successful registration
- Error state persists until user corrects input
- All changes follow existing code patterns and style

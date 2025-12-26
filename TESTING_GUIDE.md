# Testing Guide - Complete Setup

## 🎯 What Was Generated

This testing suite provides **comprehensive unit tests** for all database models and utilities added in this branch:

### Test Files Created
1. `__tests__/database/event.model.test.ts` - 60+ tests for Event model
2. `__tests__/database/booking.model.test.ts` - 30+ tests for Booking model  
3. `__tests__/lib/mongodb.test.ts` - 25+ tests for MongoDB connection utility
4. `__tests__/database/index.test.ts` - 8+ tests for database exports

### Configuration Files
- `jest.config.ts` - Jest configuration with Next.js integration
- `jest.setup.ts` - Global test setup
- `package.json` - Updated with test scripts and dependencies
- `__tests__/README.md` - Test documentation

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install the new testing dependencies:
- `jest` - Test framework
- `ts-jest` - TypeScript support for Jest
- `@types/jest` - TypeScript definitions
- `mongodb-memory-server` - In-memory MongoDB for testing
- `jest-environment-node` - Node.js test environment

### 2. Run Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Generate code coverage report
npm run test:coverage
```

## 📊 Test Coverage Details

### Event Model Tests (60+ tests)

**Model Creation**
- ✅ Create event with all required fields
- ✅ Create event with minimal fields
- ✅ Validate all required fields

**Slug Generation**
- ✅ Generate lowercase slugs from titles
- ✅ Replace spaces with hyphens
- ✅ Remove special characters
- ✅ Collapse multiple hyphens
- ✅ Remove leading/trailing hyphens
- ✅ Regenerate on title modification
- ✅ Keep existing slug when other fields change

**Date Normalization**
- ✅ Normalize ISO dates to YYYY-MM-DD
- ✅ Handle various date formats
- ✅ Reject invalid dates
- ✅ Update dates correctly

**Time Normalization**
- ✅ Normalize to HH:MM 24-hour format
- ✅ Convert 12-hour AM format
- ✅ Convert 12-hour PM format
- ✅ Handle midnight (12:00 AM → 00:00)
- ✅ Handle noon (12:30 PM → 12:30)
- ✅ Reject invalid time formats

**Validation**
- ✅ Require all mandatory fields
- ✅ Enforce mode enum (online/offline/hybrid)
- ✅ Require at least one agenda item
- ✅ Require at least one tag
- ✅ Trim whitespace
- ✅ Enforce unique slugs

**Edge Cases**
- ✅ Handle very long titles
- ✅ Handle Unicode characters
- ✅ Handle multiple agenda/tag items

### Booking Model Tests (30+ tests)

**Model Creation**
- ✅ Create booking with valid event
- ✅ Convert email to lowercase
- ✅ Trim email whitespace

**Email Validation**
- ✅ Accept valid emails (various formats)
- ✅ Reject emails without @
- ✅ Reject emails without domain
- ✅ Reject emails without username
- ✅ Reject emails with spaces
- ✅ Reject emails without TLD

**Event Reference**
- ✅ Accept valid event references
- ✅ Reject non-existent event IDs
- ✅ Validate on creation
- ✅ Validate on modification
- ✅ Handle Event model registration issues

**Database Operations**
- ✅ Find bookings by event
- ✅ Find bookings by email
- ✅ Count bookings
- ✅ Populate event details
- ✅ Update bookings
- ✅ Delete bookings

**Edge Cases**
- ✅ Multiple bookings per event
- ✅ Same email for different events
- ✅ Long email addresses
- ✅ Emails with special characters

### MongoDB Connection Tests (25+ tests)

**Environment Validation**
- ✅ Require MONGODB_URI
- ✅ Accept valid URI formats

**Connection Caching**
- ✅ Return cached connections
- ✅ Create new connections
- ✅ Prevent duplicate connections
- ✅ Cache promises
- ✅ Persist in global object

**Error Handling**
- ✅ Reset cache on failure
- ✅ Allow retries
- ✅ Handle network errors
- ✅ Handle authentication errors

**Concurrency**
- ✅ Handle simultaneous requests
- ✅ Share connections properly

**Hot Reload**
- ✅ Reuse connections across reloads
- ✅ Persist cache correctly

### Database Index Tests (8 tests)

**Module Exports**
- ✅ Export Event model
- ✅ Export Booking model
- ✅ Export IEvent type
- ✅ Export IBooking type
- ✅ Support destructured imports
- ✅ Maintain reference integrity

## 🏗️ Architecture

### Test Structure
# Test Suite

This directory contains comprehensive unit tests for the database models and utilities.

## Test Coverage

### Database Models
- **Event Model** (`database/event.model.test.ts`): Tests for event creation, validation, slug generation, date/time normalization, and constraints
- **Booking Model** (`database/booking.model.test.ts`): Tests for booking creation, email validation, event reference validation, and database operations
- **Database Index** (`database/index.test.ts`): Tests for module exports and TypeScript type definitions

### Utilities
- **MongoDB Connection** (`lib/mongodb.test.ts`): Tests for connection caching, error handling, and environment variable validation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Environment

Tests use:
- **Jest** as the test framework
- **mongodb-memory-server** for in-memory MongoDB instances
- **ts-jest** for TypeScript support

## Writing New Tests

When adding new tests:
1. Follow the existing test structure and naming conventions
2. Use descriptive test names that clearly communicate intent
3. Test happy paths, edge cases, and error conditions
4. Clean up test data in `afterEach` hooks
5. Mock external dependencies appropriately
# Testing Quick Reference Guide

## Quick Start

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Test File Statistics

- booking.model.test.ts: 751 lines
- event.model.test.ts: 1,441 lines  
- index.test.ts: 229 lines
- mongodb.test.ts: 441 lines
- **Total: 2,862 lines**

## Common Commands

Run specific test file:
```bash
npm test -- booking.model.test.ts
```

Run tests matching pattern:
```bash
npm test -- -t "email validation"
```

View coverage report:
```bash
npm run test:coverage
```

## Test Categories

### Booking Model Tests
- Email validation (international domains, special chars)
- Event reference validation
- Database operations (CRUD)
- Boundary conditions
- Schema verification
- Concurrent operations

### Event Model Tests
- Slug generation (unicode, special chars)
- Date/time normalization
- Field validation
- Database operations
- Schema verification
- Aggregation operations

### Database Index Tests
- Model exports
- Type safety
- Import patterns
- Integration tests

### MongoDB Connection Tests
- Connection caching
- Error handling
- Environment validation
- Concurrent access

## Coverage Targets

- Line Coverage: >95%
- Branch Coverage: >90%
- Function Coverage: >95%
- Statement Coverage: >95%

## Debugging

Run with verbose output:
```bash
npm test -- --verbose
```

Run single test:
```bash
npm test -- -t "should create a valid booking"
```

Clear cache:
```bash
npm test -- --no-cache
```

---
Last Updated: December 26, 2024
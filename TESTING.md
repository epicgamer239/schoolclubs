# Testing Guide for Clubs Website

This guide covers all the testing strategies and tools set up for the clubs website.

## 🧪 Testing Framework Overview

### Unit Tests (Jest + React Testing Library)
- **Location**: `__tests__/` directory
- **Purpose**: Test individual components and utility functions
- **Coverage**: Components, utilities, hooks

### Integration Tests (Jest)
- **Location**: `__tests__/api/` directory
- **Purpose**: Test API endpoints and data flow
- **Coverage**: Firebase interactions, data validation

### End-to-End Tests (Playwright)
- **Location**: `e2e/` directory
- **Purpose**: Test complete user workflows
- **Coverage**: Authentication, navigation, form submissions

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
# Unit and integration tests
npm test

# End-to-end tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### Run Specific Test Types
```bash
# Component tests only
npm run test:components

# Utility tests only
npm run test:utils

# API tests only
npm run test:api

# E2E tests with UI
npm run test:e2e:ui

# E2E tests in headed mode (see browser)
npm run test:e2e:headed
```

## 📋 Test Categories

### 1. Authentication Tests
- ✅ Login form validation
- ✅ Signup form validation
- ✅ Password strength requirements
- ✅ Email format validation
- ✅ Protected route access
- ✅ Role-based access control

### 2. School Management Tests
- ✅ School creation flow
- ✅ Join code generation
- ✅ Authorized user management
- ✅ School settings updates
- ✅ Form validation

### 3. Club Management Tests
- ✅ Club creation
- ✅ Club joining
- ✅ Member management
- ✅ Club settings
- ✅ Join requests

### 4. User Management Tests
- ✅ Student registration
- ✅ Teacher registration
- ✅ Role assignment
- ✅ User profile updates

### 5. UI/UX Tests
- ✅ Responsive design
- ✅ Navigation flows
- ✅ Form interactions
- ✅ Error handling
- ✅ Loading states

## 🧩 Unit Test Examples

### Component Testing
```javascript
// Test component rendering
test('renders login form', () => {
  render(<LoginForm />)
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
})

// Test user interactions
test('submits form with valid data', async () => {
  const user = userEvent.setup()
  render(<LoginForm />)
  
  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.type(screen.getByLabelText(/password/i), 'Password123!')
  await user.click(screen.getByRole('button', { name: /login/i }))
  
  expect(mockLogin).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'Password123!'
  })
})
```

### Utility Function Testing
```javascript
// Test validation functions
test('validates email format', () => {
  expect(validateEmail('test@example.com')).toBe(true)
  expect(validateEmail('invalid-email')).toBe(false)
})

// Test data transformation
test('formats school code correctly', () => {
  expect(formatSchoolCode('abc123')).toBe('ABC123')
})
```

## 🌐 End-to-End Test Examples

### Authentication Flow
```javascript
test('complete login flow', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'admin@school.edu')
  await page.fill('input[type="password"]', 'Password123!')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/admin/dashboard')
  await expect(page.locator('text=Admin Dashboard')).toBeVisible()
})
```

### School Management Flow
```javascript
test('manage school settings', async ({ page }) => {
  await page.goto('/admin/school')
  await page.fill('input[placeholder*="school name"]', 'Updated School')
  await page.click('button[type="submit"]')
  
  await expect(page.locator('text=School settings updated successfully')).toBeVisible()
})
```

## 📊 Test Coverage

### Current Coverage Targets
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

### Coverage Report
Run `npm run test:coverage` to generate a detailed coverage report.

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses Next.js Jest configuration
- Tests React components with jsdom
- Includes coverage thresholds
- Mocks Firebase and Next.js router

### Playwright Configuration (`playwright.config.js`)
- Tests multiple browsers (Chrome, Firefox, Safari)
- Mobile and tablet viewports
- Automatic dev server startup
- Parallel test execution

## 🐛 Debugging Tests

### Debug Unit Tests
```bash
# Run specific test file
npm test AuthContext.test.js

# Run tests in watch mode
npm run test:watch

# Debug with console.log
npm test -- --verbose
```

### Debug E2E Tests
```bash
# Run tests with browser visible
npm run test:e2e:headed

# Run tests with Playwright UI
npm run test:e2e:ui

# Debug specific test
npx playwright test auth.spec.js --debug
```

## 📝 Writing New Tests

### Unit Test Template
```javascript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentName } from '../ComponentName'

describe('ComponentName', () => {
  test('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  test('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<ComponentName />)
    
    await user.click(screen.getByRole('button'))
    expect(mockFunction).toHaveBeenCalled()
  })
})
```

### E2E Test Template
```javascript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should complete user workflow', async ({ page }) => {
    await page.goto('/page-url')
    
    // Perform actions
    await page.fill('input[name="field"]', 'value')
    await page.click('button[type="submit"]')
    
    // Assert results
    await expect(page.locator('text=Success')).toBeVisible()
  })
})
```

## 🚨 Common Issues & Solutions

### Firebase Mocking
```javascript
// Mock Firebase in tests
jest.mock('../firebase', () => ({
  auth: { currentUser: null },
  firestore: { collection: jest.fn() }
}))
```

### Async Testing
```javascript
// Wait for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

### Form Testing
```javascript
// Test form submission
await user.type(screen.getByLabelText('Email'), 'test@example.com')
await user.click(screen.getByRole('button', { name: 'Submit' }))
```

## 📈 Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

## 🎯 Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal implementation details

2. **Use Descriptive Test Names**
   - Clear, readable test descriptions
   - Explain the expected behavior

3. **Keep Tests Independent**
   - Each test should run in isolation
   - Clean up state between tests

4. **Mock External Dependencies**
   - Mock Firebase, APIs, and external services
   - Use consistent mock data

5. **Test Error Cases**
   - Invalid inputs
   - Network failures
   - Authentication errors

6. **Maintain Test Data**
   - Use factories for test data
   - Keep test data realistic

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Next.js Testing](https://nextjs.org/docs/testing)

## 🤝 Contributing to Tests

When adding new features:
1. Write unit tests for components and utilities
2. Write integration tests for API endpoints
3. Write E2E tests for user workflows
4. Update this documentation if needed

Remember: **Good tests are documentation that never goes out of date!** 
import { render, screen } from '@testing-library/react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { AuthContext } from '../../components/AuthContext'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const MockAuthProvider = ({ children, value }) => {
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('shows loading spinner when auth is loading', () => {
    const mockAuthValue = {
      user: null,
      userData: null,
      loading: true,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <ProtectedRoute requiredRole="admin">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('shows loading spinner when auth is loading (no role required)', () => {
    const mockAuthValue = {
      user: null,
      userData: null,
      loading: true,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('redirects to login when user is not authenticated', () => {
    const mockAuthValue = {
      user: null,
      userData: null,
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <ProtectedRoute requiredRole="admin">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  test('redirects to verify-email when user is not email verified', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: false },
      userData: {
        uid: 'test-uid',
        role: 'student',
        schoolId: 'test-school',
      },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <ProtectedRoute requiredRole="student">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(mockPush).toHaveBeenCalledWith('/verify-email')
  })

  test('allows access when user has required role and is email verified', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: {
        uid: 'test-uid',
        role: 'admin',
        schoolId: 'test-school',
      },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <ProtectedRoute requiredRole="admin">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  test('allows access when no role is required and user is email verified', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: {
        uid: 'test-uid',
        role: 'student',
        schoolId: 'test-school',
      },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  test('redirects when user does not have required role', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: {
        uid: 'test-uid',
        role: 'student',
        schoolId: 'test-school',
      },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <ProtectedRoute requiredRole="admin">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(mockPush).toHaveBeenCalledWith('/student/dashboard')
  })

  test('redirects student to student dashboard when accessing admin route', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: {
        uid: 'test-uid',
        role: 'student',
        schoolId: 'test-school',
      },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <ProtectedRoute requiredRole="admin">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(mockPush).toHaveBeenCalledWith('/student/dashboard')
  })

  test('redirects teacher to teacher dashboard when accessing admin route', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: {
        uid: 'test-uid',
        role: 'teacher',
        schoolId: 'test-school',
      },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <ProtectedRoute requiredRole="admin">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(mockPush).toHaveBeenCalledWith('/teacher/dashboard')
  })

  test('redirects admin to admin dashboard when accessing student route', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: {
        uid: 'test-uid',
        role: 'admin',
        schoolId: 'test-school',
      },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <ProtectedRoute requiredRole="student">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(mockPush).toHaveBeenCalledWith('/admin/dashboard')
  })

  test('handles user without userData gracefully', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: null,
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <ProtectedRoute requiredRole="admin">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(mockPush).toHaveBeenCalledWith('/welcome')
  })

  test('handles user without role gracefully', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: {
        uid: 'test-uid',
        schoolId: 'test-school',
        // no role property
      },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <ProtectedRoute requiredRole="admin">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(mockPush).toHaveBeenCalledWith('/welcome')
  })
}) 
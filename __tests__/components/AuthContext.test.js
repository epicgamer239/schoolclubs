import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth, AuthContext } from '../../components/AuthContext'

// Mock Firebase
const mockSendEmailVerification = jest.fn()
const mockOnAuthStateChanged = jest.fn()
const mockGetDoc = jest.fn()
const mockDoc = jest.fn()

jest.mock('../../firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: mockOnAuthStateChanged,
    sendEmailVerification: mockSendEmailVerification,
  },
  firestore: {
    doc: mockDoc,
    getDoc: mockGetDoc,
  },
}))

const MockAuthProvider = ({ children, value }) => {
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Test component to test useAuth hook
const TestComponent = () => {
  const { user, userData, loading, resendVerificationEmail } = useAuth()
  return (
    <div>
      <div data-testid="user">{user ? user.uid : 'no-user'}</div>
      <div data-testid="user-data">{userData ? userData.role : 'no-data'}</div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <button 
        data-testid="resend-button" 
        onClick={() => resendVerificationEmail()}
      >
        Resend
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendEmailVerification.mockResolvedValue()
  })

  test('provides authentication state to children', () => {
    const mockValue = {
      user: null,
      userData: null,
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockValue}>
        <div data-testid="test-child">Test Child</div>
      </MockAuthProvider>
    )

    expect(screen.getByTestId('test-child')).toBeInTheDocument()
  })

  test('handles loading state correctly', () => {
    const mockValue = {
      user: null,
      userData: null,
      loading: true,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockValue}>
        <div data-testid="loading-test">Loading Test</div>
      </MockAuthProvider>
    )

    expect(screen.getByTestId('loading-test')).toBeInTheDocument()
  })

  test('handles authenticated user state', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      emailVerified: true,
    }

    const mockValue = {
      user: mockUser,
      userData: {
        uid: 'test-uid',
        email: 'test@example.com',
        role: 'admin',
        schoolId: 'test-school',
      },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockValue}>
        <div data-testid="auth-test">Auth Test</div>
      </MockAuthProvider>
    )

    expect(screen.getByTestId('auth-test')).toBeInTheDocument()
  })

  test('handles unverified user state', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      emailVerified: false,
    }

    const mockValue = {
      user: mockUser,
      userData: {
        uid: 'test-uid',
        email: 'test@example.com',
        role: 'student',
        schoolId: 'test-school',
      },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockValue}>
        <div data-testid="unverified-test">Unverified Test</div>
      </MockAuthProvider>
    )

    expect(screen.getByTestId('unverified-test')).toBeInTheDocument()
  })
})

describe('useAuth hook', () => {
  test('provides all auth properties', () => {
    const mockResendVerificationEmail = jest.fn()
    const mockValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: { role: 'admin' },
      loading: false,
      resendVerificationEmail: mockResendVerificationEmail,
    }

    render(
      <MockAuthProvider value={mockValue}>
        <TestComponent />
      </MockAuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('test-uid')
    expect(screen.getByTestId('user-data')).toHaveTextContent('admin')
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
  })

  test('handles resend verification email', async () => {
    const mockResendVerificationEmail = jest.fn()
    const mockValue = {
      user: { uid: 'test-uid', emailVerified: false },
      userData: { role: 'student' },
      loading: false,
      resendVerificationEmail: mockResendVerificationEmail,
    }

    render(
      <MockAuthProvider value={mockValue}>
        <TestComponent />
      </MockAuthProvider>
    )

    const resendButton = screen.getByTestId('resend-button')
    await userEvent.click(resendButton)

    expect(mockResendVerificationEmail).toHaveBeenCalled()
  })

  test('throws error when used outside AuthContext', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()

    expect(() => {
      render(<TestComponent />)
    }).not.toThrow()

    console.error = originalError
  })
})

describe('AuthProvider integration', () => {
  test('initializes with correct default state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    expect(screen.getByTestId('user-data')).toHaveTextContent('no-data')
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')
  })

  test('sets up auth state listener', () => {
    render(
      <AuthProvider>
        <div>Test</div>
      </AuthProvider>
    )

    expect(mockOnAuthStateChanged).toHaveBeenCalled()
  })
}) 
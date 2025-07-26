import { render, screen } from '@testing-library/react'
import DashboardTopBar from '../../components/DashboardTopBar'
import { AuthContext } from '../../components/AuthContext'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Firebase
const mockSignOut = jest.fn()
jest.mock('../../firebase', () => ({
  auth: {
    signOut: mockSignOut,
  },
}))

const MockAuthProvider = ({ children, value }) => {
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

describe('DashboardTopBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders dashboard title', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: { role: 'admin', name: 'Test User' },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Admin Dashboard" />
      </MockAuthProvider>
    )

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  test('renders user name when available', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: { role: 'admin', name: 'John Doe' },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  test('renders user email when name is not available', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', email: 'test@example.com', emailVerified: true },
      userData: { role: 'admin' },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  test('shows email verification banner for unverified users', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', email: 'test@example.com', emailVerified: false },
      userData: { role: 'student', name: 'Test User' },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    expect(screen.getByText(/Please verify your email address/i)).toBeInTheDocument()
  })

  test('does not show email verification banner for verified users', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', email: 'test@example.com', emailVerified: true },
      userData: { role: 'student', name: 'Test User' },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    expect(screen.queryByText(/Please verify your email address/i)).not.toBeInTheDocument()
  })

  test('renders logout button', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: { role: 'admin', name: 'Test User' },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  test('handles logout click', async () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: { role: 'admin', name: 'Test User' },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    logoutButton.click()

    expect(mockSignOut).toHaveBeenCalled()
  })

  test('redirects to login after logout', async () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: { role: 'admin', name: 'Test User' },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    logoutButton.click()

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  test('handles loading state gracefully', () => {
    const mockAuthValue = {
      user: null,
      userData: null,
      loading: true,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  test('handles missing user data gracefully', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: null,
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  test('renders with correct styling classes', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: { role: 'admin', name: 'Test User' },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    const topBar = screen.getByTestId('dashboard-top-bar')
    expect(topBar).toHaveClass('bg-white', 'shadow-sm', 'border-b', 'border-gray-200')
  })

  test('shows user role in the display', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: { role: 'teacher', name: 'Test User' },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  test('handles special characters in user name', () => {
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: { role: 'admin', name: 'José María O\'Connor' },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    expect(screen.getByText('José María O\'Connor')).toBeInTheDocument()
  })

  test('handles long user names gracefully', () => {
    const longName = 'This is a very long user name that should be displayed properly without breaking the layout'
    const mockAuthValue = {
      user: { uid: 'test-uid', emailVerified: true },
      userData: { role: 'admin', name: longName },
      loading: false,
      resendVerificationEmail: jest.fn(),
    }

    render(
      <MockAuthProvider value={mockAuthValue}>
        <DashboardTopBar title="Dashboard" />
      </MockAuthProvider>
    )

    expect(screen.getByText(longName)).toBeInTheDocument()
  })
}) 
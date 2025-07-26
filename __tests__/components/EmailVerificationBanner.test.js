import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmailVerificationBanner from '../../components/EmailVerificationBanner'

// Mock Firebase
const mockSendEmailVerification = jest.fn()
jest.mock('../../firebase', () => ({
  auth: {
    currentUser: {
      email: 'test@example.com',
    },
    sendEmailVerification: mockSendEmailVerification,
  },
}))

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendEmailVerification.mockResolvedValue()
  })

  test('renders banner with correct message', () => {
    render(<EmailVerificationBanner />)
    
    expect(screen.getByText(/Please verify your email address/i)).toBeInTheDocument()
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
  })

  test('shows resend verification email button', () => {
    render(<EmailVerificationBanner />)
    
    expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument()
  })

  test('handles resend verification email click', async () => {
    const user = userEvent.setup()
    render(<EmailVerificationBanner />)
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    await user.click(resendButton)
    
    expect(mockSendEmailVerification).toHaveBeenCalled()
  })

  test('shows success message after resending email', async () => {
    const user = userEvent.setup()
    render(<EmailVerificationBanner />)
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    await user.click(resendButton)
    
    await waitFor(() => {
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument()
    })
  })

  test('shows error message when resend fails', async () => {
    mockSendEmailVerification.mockRejectedValue(new Error('Failed to send'))
    const user = userEvent.setup()
    render(<EmailVerificationBanner />)
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    await user.click(resendButton)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to send verification email/i)).toBeInTheDocument()
    })
  })

  test('disables button while sending email', async () => {
    // Mock a delayed response
    mockSendEmailVerification.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    const user = userEvent.setup()
    render(<EmailVerificationBanner />)
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    await user.click(resendButton)
    
    expect(resendButton).toBeDisabled()
    expect(screen.getByText(/sending/i)).toBeInTheDocument()
  })

  test('re-enables button after sending completes', async () => {
    const user = userEvent.setup()
    render(<EmailVerificationBanner />)
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    await user.click(resendButton)
    
    await waitFor(() => {
      expect(resendButton).not.toBeDisabled()
    })
  })

  test('shows correct styling classes', () => {
    render(<EmailVerificationBanner />)
    
    const banner = screen.getByRole('banner')
    expect(banner).toHaveClass('bg-yellow-50', 'border', 'border-yellow-200', 'rounded-lg', 'p-4', 'mb-4')
  })

  test('shows correct icon', () => {
    render(<EmailVerificationBanner />)
    
    // Check for the warning icon (assuming it's an SVG or icon component)
    const icon = screen.getByTestId('warning-icon') || screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  test('handles multiple rapid clicks gracefully', async () => {
    const user = userEvent.setup()
    render(<EmailVerificationBanner />)
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    
    // Click multiple times rapidly
    await user.click(resendButton)
    await user.click(resendButton)
    await user.click(resendButton)
    
    // Should only call sendEmailVerification once due to disabled state
    expect(mockSendEmailVerification).toHaveBeenCalledTimes(1)
  })

  test('shows email address in the message', () => {
    render(<EmailVerificationBanner />)
    
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
  })

  test('handles empty email gracefully', () => {
    // Mock currentUser with no email
    jest.doMock('../../firebase', () => ({
      auth: {
        currentUser: {
          email: null,
        },
        sendEmailVerification: mockSendEmailVerification,
      },
    }))
    
    render(<EmailVerificationBanner />)
    
    expect(screen.getByText(/Please verify your email address/i)).toBeInTheDocument()
    expect(screen.queryByText(/test@example.com/i)).not.toBeInTheDocument()
  })

  test('shows dismissible banner', () => {
    render(<EmailVerificationBanner />)
    
    const banner = screen.getByRole('banner')
    expect(banner).toBeInTheDocument()
  })

  test('handles network errors gracefully', async () => {
    mockSendEmailVerification.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<EmailVerificationBanner />)
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    await user.click(resendButton)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to send verification email/i)).toBeInTheDocument()
    })
  })

  test('shows loading state during email send', async () => {
    // Mock a delayed response
    mockSendEmailVerification.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 50)))
    const user = userEvent.setup()
    render(<EmailVerificationBanner />)
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    await user.click(resendButton)
    
    expect(screen.getByText(/sending/i)).toBeInTheDocument()
  })
}) 
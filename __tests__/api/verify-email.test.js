import { NextRequest } from 'next/server'
import { POST } from '../../app/api/verify-email/route'

// Mock Firebase
const mockSendEmailVerification = jest.fn()
const mockReload = jest.fn()
const mockCurrentUser = {
  email: 'test@example.com',
  emailVerified: false,
  reload: mockReload,
}

jest.mock('../../firebase', () => ({
  auth: {
    currentUser: mockCurrentUser,
    sendEmailVerification: mockSendEmailVerification,
  },
}))

describe('Email Verification API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentUser.emailVerified = false
  })

  describe('POST /api/verify-email', () => {
    test('resends verification email successfully', async () => {
      mockSendEmailVerification.mockResolvedValue()

      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'resend' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ message: 'Verification email sent successfully' })
      expect(mockSendEmailVerification).toHaveBeenCalled()
    })

    test('checks verification status successfully when verified', async () => {
      mockCurrentUser.emailVerified = true
      mockReload.mockResolvedValue()

      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'check' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ 
        verified: true, 
        message: 'Email verified successfully' 
      })
      expect(mockReload).toHaveBeenCalled()
    })

    test('checks verification status when not verified', async () => {
      mockCurrentUser.emailVerified = false
      mockReload.mockResolvedValue()

      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'check' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ 
        verified: false, 
        message: 'Email not yet verified' 
      })
      expect(mockReload).toHaveBeenCalled()
    })

    test('returns 400 when action is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Action is required')
    })

    test('returns 400 when action is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'invalid' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action. Use "resend" or "check"')
    })

    test('returns 401 when no user is logged in', async () => {
      // Mock no current user
      jest.doMock('../../firebase', () => ({
        auth: {
          currentUser: null,
          sendEmailVerification: mockSendEmailVerification,
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'resend' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No user logged in')
    })

    test('handles sendEmailVerification errors gracefully', async () => {
      mockSendEmailVerification.mockRejectedValue(new Error('Failed to send email'))

      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'resend' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to send verification email')
    })

    test('handles reload errors gracefully', async () => {
      mockReload.mockRejectedValue(new Error('Failed to reload user'))

      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'check' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to check verification status')
    })

    test('handles network errors gracefully', async () => {
      mockSendEmailVerification.mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'resend' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to send verification email')
    })

    test('handles malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: 'invalid-json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON in request body')
    })

    test('handles missing request body gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Request body is required')
    })
  })

  describe('Email verification flow', () => {
    test('complete verification flow', async () => {
      // Step 1: Resend verification email
      mockSendEmailVerification.mockResolvedValue()

      const resendRequest = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'resend' })
      })

      const resendResponse = await POST(resendRequest)
      const resendData = await resendResponse.json()

      expect(resendResponse.status).toBe(200)
      expect(resendData.message).toBe('Verification email sent successfully')

      // Step 2: Check verification status (not verified yet)
      mockCurrentUser.emailVerified = false
      mockReload.mockResolvedValue()

      const checkRequest1 = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'check' })
      })

      const checkResponse1 = await POST(checkRequest1)
      const checkData1 = await checkResponse1.json()

      expect(checkResponse1.status).toBe(200)
      expect(checkData1.verified).toBe(false)

      // Step 3: Check verification status (now verified)
      mockCurrentUser.emailVerified = true

      const checkRequest2 = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'check' })
      })

      const checkResponse2 = await POST(checkRequest2)
      const checkData2 = await checkResponse2.json()

      expect(checkResponse2.status).toBe(200)
      expect(checkData2.verified).toBe(true)
    })

    test('handles rapid resend requests', async () => {
      mockSendEmailVerification.mockResolvedValue()

      const request1 = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'resend' })
      })

      const request2 = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'resend' })
      })

      const response1 = await POST(request1)
      const response2 = await POST(request2)

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(mockSendEmailVerification).toHaveBeenCalledTimes(2)
    })

    test('handles rapid check requests', async () => {
      mockCurrentUser.emailVerified = false
      mockReload.mockResolvedValue()

      const request1 = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'check' })
      })

      const request2 = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'check' })
      })

      const response1 = await POST(request1)
      const response2 = await POST(request2)

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(mockReload).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling', () => {
    test('handles Firebase auth errors', async () => {
      // Mock Firebase auth error
      jest.doMock('../../firebase', () => ({
        auth: {
          currentUser: {
            email: 'test@example.com',
            emailVerified: false,
            reload: jest.fn().mockRejectedValue(new Error('Auth error')),
          },
          sendEmailVerification: mockSendEmailVerification,
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'check' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to check verification status')
    })

    test('handles user without email', async () => {
      // Mock user without email
      jest.doMock('../../firebase', () => ({
        auth: {
          currentUser: {
            email: null,
            emailVerified: false,
            reload: mockReload,
          },
          sendEmailVerification: mockSendEmailVerification,
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'resend' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User has no email address')
    })
  })
}) 
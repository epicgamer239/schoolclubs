import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '../../components/Modal'

describe('Modal Component', () => {
  const mockOnClose = jest.fn()
  const mockOnConfirm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders modal when isOpen is true', () => {
    render(
      <Modal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Test Modal"
        message="Test message"
      />
    )

    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  test('does not render when isOpen is false', () => {
    render(
      <Modal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Test Modal"
        message="Test message"
      />
    )

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  test('calls onClose when cancel button is clicked', () => {
    render(
      <Modal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Test Modal"
        message="Test message"
        type="confirm"
      />
    )

    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('calls onConfirm when confirm button is clicked', () => {
    render(
      <Modal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Test Modal"
        message="Test message"
        type="confirm"
      />
    )

    fireEvent.click(screen.getByText('Confirm'))
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })
}) 
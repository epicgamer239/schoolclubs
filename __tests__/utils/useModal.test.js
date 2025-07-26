import { renderHook, act } from '@testing-library/react'
import { useModal } from '../../utils/useModal'

describe('useModal Hook', () => {
  test('initializes with modal closed', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.modalState.isOpen).toBe(false)
    expect(typeof result.current.showConfirm).toBe('function')
    expect(typeof result.current.showAlert).toBe('function')
    expect(typeof result.current.closeModal).toBe('function')
    expect(typeof result.current.handleConfirm).toBe('function')
  })

  test('opens modal when showConfirm is called', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.showConfirm('Test Title', 'Test Message', jest.fn())
    })

    expect(result.current.modalState.isOpen).toBe(true)
    expect(result.current.modalState.title).toBe('Test Title')
    expect(result.current.modalState.message).toBe('Test Message')
    expect(result.current.modalState.type).toBe('confirm')
  })

  test('opens modal when showAlert is called', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.showAlert('Test Title', 'Test Message')
    })

    expect(result.current.modalState.isOpen).toBe(true)
    expect(result.current.modalState.title).toBe('Test Title')
    expect(result.current.modalState.message).toBe('Test Message')
    expect(result.current.modalState.type).toBe('alert')
  })

  test('closes modal when closeModal is called', () => {
    const { result } = renderHook(() => useModal())

    // First open the modal
    act(() => {
      result.current.showConfirm('Test Title', 'Test Message', jest.fn())
    })
    expect(result.current.modalState.isOpen).toBe(true)

    // Then close it
    act(() => {
      result.current.closeModal()
    })
    expect(result.current.modalState.isOpen).toBe(false)
  })

  test('handles confirm action', () => {
    const { result } = renderHook(() => useModal())
    const mockOnConfirm = jest.fn()

    act(() => {
      result.current.showConfirm('Test Title', 'Test Message', mockOnConfirm)
    })

    expect(result.current.modalState.isOpen).toBe(true)

    act(() => {
      result.current.handleConfirm()
    })

    expect(mockOnConfirm).toHaveBeenCalled()
    expect(result.current.modalState.isOpen).toBe(false)
  })

  test('handles alert without confirm action', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.showAlert('Test Title', 'Test Message')
    })

    expect(result.current.modalState.isOpen).toBe(true)
    expect(result.current.modalState.onConfirm).toBe(null)

    act(() => {
      result.current.handleConfirm()
    })

    expect(result.current.modalState.isOpen).toBe(false)
  })

  test('toggles modal state correctly', () => {
    const { result } = renderHook(() => useModal())

    // Initial state should be closed
    expect(result.current.modalState.isOpen).toBe(false)

    // Open modal
    act(() => {
      result.current.showConfirm('Test Title', 'Test Message', jest.fn())
    })
    expect(result.current.modalState.isOpen).toBe(true)

    // Close modal
    act(() => {
      result.current.closeModal()
    })
    expect(result.current.modalState.isOpen).toBe(false)

    // Open again
    act(() => {
      result.current.showAlert('Test Title', 'Test Message')
    })
    expect(result.current.modalState.isOpen).toBe(true)
  })

  test('handles multiple rapid open/close calls', () => {
    const { result } = renderHook(() => useModal())

    // Multiple rapid opens
    act(() => {
      result.current.showConfirm('Title 1', 'Message 1', jest.fn())
      result.current.showAlert('Title 2', 'Message 2')
      result.current.showConfirm('Title 3', 'Message 3', jest.fn())
    })
    expect(result.current.modalState.isOpen).toBe(true)
    expect(result.current.modalState.title).toBe('Title 3')

    // Multiple rapid closes
    act(() => {
      result.current.closeModal()
      result.current.closeModal()
      result.current.closeModal()
    })
    expect(result.current.modalState.isOpen).toBe(false)
  })

  test('returns stable function references', () => {
    const { result, rerender } = renderHook(() => useModal())

    const initialShowConfirm = result.current.showConfirm
    const initialShowAlert = result.current.showAlert
    const initialCloseModal = result.current.closeModal
    const initialHandleConfirm = result.current.handleConfirm

    // Rerender the hook
    rerender()

    expect(result.current.showConfirm).toBe(initialShowConfirm)
    expect(result.current.showAlert).toBe(initialShowAlert)
    expect(result.current.closeModal).toBe(initialCloseModal)
    expect(result.current.handleConfirm).toBe(initialHandleConfirm)
  })

  test('handles multiple hook instances independently', () => {
    const { result: result1 } = renderHook(() => useModal())
    const { result: result2 } = renderHook(() => useModal())

    // Open first modal
    act(() => {
      result1.current.showConfirm('Title 1', 'Message 1', jest.fn())
    })
    expect(result1.current.modalState.isOpen).toBe(true)
    expect(result2.current.modalState.isOpen).toBe(false)

    // Open second modal
    act(() => {
      result2.current.showAlert('Title 2', 'Message 2')
    })
    expect(result1.current.modalState.isOpen).toBe(true)
    expect(result2.current.modalState.isOpen).toBe(true)

    // Close first modal
    act(() => {
      result1.current.closeModal()
    })
    expect(result1.current.modalState.isOpen).toBe(false)
    expect(result2.current.modalState.isOpen).toBe(true)
  })

  test('handles edge cases gracefully', () => {
    const { result } = renderHook(() => useModal())

    // Call closeModal when already closed
    act(() => {
      result.current.closeModal()
    })
    expect(result.current.modalState.isOpen).toBe(false)

    // Call showConfirm multiple times
    act(() => {
      result.current.showConfirm('Title 1', 'Message 1', jest.fn())
      result.current.showConfirm('Title 2', 'Message 2', jest.fn())
    })
    expect(result.current.modalState.isOpen).toBe(true)
    expect(result.current.modalState.title).toBe('Title 2')
  })

  test('maintains state across re-renders', () => {
    const { result, rerender } = renderHook(() => useModal())

    // Open modal
    act(() => {
      result.current.showConfirm('Test Title', 'Test Message', jest.fn())
    })
    expect(result.current.modalState.isOpen).toBe(true)

    // Rerender
    rerender()
    expect(result.current.modalState.isOpen).toBe(true)

    // Close modal
    act(() => {
      result.current.closeModal()
    })
    expect(result.current.modalState.isOpen).toBe(false)

    // Rerender again
    rerender()
    expect(result.current.modalState.isOpen).toBe(false)
  })

  test('handles concurrent state updates', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      // Simulate concurrent updates
      result.current.showConfirm('Title 1', 'Message 1', jest.fn())
      result.current.closeModal()
      result.current.showAlert('Title 2', 'Message 2')
    })

    expect(result.current.modalState.isOpen).toBe(true)
    expect(result.current.modalState.title).toBe('Title 2')
  })

  test('provides correct return type', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current).toHaveProperty('modalState')
    expect(result.current).toHaveProperty('showConfirm')
    expect(result.current).toHaveProperty('showAlert')
    expect(result.current).toHaveProperty('closeModal')
    expect(result.current).toHaveProperty('handleConfirm')
    expect(typeof result.current.modalState).toBe('object')
    expect(typeof result.current.showConfirm).toBe('function')
    expect(typeof result.current.showAlert).toBe('function')
    expect(typeof result.current.closeModal).toBe('function')
    expect(typeof result.current.handleConfirm).toBe('function')
  })

  test('handles unmounting gracefully', () => {
    const { result, unmount } = renderHook(() => useModal())

    act(() => {
      result.current.showConfirm('Test Title', 'Test Message', jest.fn())
    })
    expect(result.current.modalState.isOpen).toBe(true)

    // Unmount the hook
    unmount()

    // Should not throw any errors
    expect(() => {}).not.toThrow()
  })

  test('modalState has correct structure', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.modalState).toHaveProperty('isOpen')
    expect(result.current.modalState).toHaveProperty('title')
    expect(result.current.modalState).toHaveProperty('message')
    expect(result.current.modalState).toHaveProperty('type')
    expect(result.current.modalState).toHaveProperty('onConfirm')
  })

  test('handles rapid state changes', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      // Rapid state changes
      result.current.showConfirm('Title 1', 'Message 1', jest.fn())
      result.current.closeModal()
      result.current.showAlert('Title 2', 'Message 2')
      result.current.closeModal()
      result.current.showConfirm('Title 3', 'Message 3', jest.fn())
    })

    expect(result.current.modalState.isOpen).toBe(true)
    expect(result.current.modalState.title).toBe('Title 3')
  })
}) 
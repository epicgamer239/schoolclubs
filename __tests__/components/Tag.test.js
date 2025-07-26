import { render, screen } from '@testing-library/react'
import Tag from '../../components/Tag'

describe('Tag Component', () => {
  test('renders tag with default props', () => {
    const tag = { name: 'Test Tag', color: '#FF5733' }
    render(<Tag tag={tag} />)
    
    expect(screen.getByText('Test Tag')).toBeInTheDocument()
  })

  test('renders tag with custom color', () => {
    const tag = { name: 'Test Tag', color: '#FF5733' }
    render(<Tag tag={tag} />)
    
    const tagElement = screen.getByText('Test Tag')
    expect(tagElement).toBeInTheDocument()
    expect(tagElement).toHaveStyle('background-color: transparent')
  })

  test('renders selected tag with background color', () => {
    const tag = { name: 'Test Tag', color: '#FF5733' }
    render(<Tag tag={tag} selected={true} />)
    
    const tagElement = screen.getByText('Test Tag')
    expect(tagElement).toBeInTheDocument()
    expect(tagElement).toHaveStyle('background-color: #FF5733')
  })

  test('renders tag with custom className', () => {
    const tag = { name: 'Test Tag', color: '#FF5733' }
    render(<Tag tag={tag} className="custom-class" />)
    
    const tagElement = screen.getByText('Test Tag')
    expect(tagElement).toHaveClass('custom-class')
  })

  test('renders tag with onClick handler', () => {
    const tag = { name: 'Clickable Tag', color: '#FF5733' }
    const handleClick = jest.fn()
    render(<Tag tag={tag} onClick={handleClick} />)
    
    const tagElement = screen.getByText('Clickable Tag')
    expect(tagElement).toBeInTheDocument()
  })

  test('renders tag without onClick handler', () => {
    const tag = { name: 'Non-clickable Tag', color: '#FF5733' }
    render(<Tag tag={tag} />)
    
    const tagElement = screen.getByText('Non-clickable Tag')
    expect(tagElement).toBeInTheDocument()
  })

  test('handles empty tag name', () => {
    const tag = { name: '', color: '#FF5733' }
    const { container } = render(<Tag tag={tag} />)
    
    // Check that the span element exists and has the correct structure
    const spanElement = container.querySelector('span')
    expect(spanElement).toBeInTheDocument()
    expect(spanElement.textContent).toBe('')
  })

  test('handles special characters in tag name', () => {
    const tag = { name: 'Tag with @#$%^&*()', color: '#FF5733' }
    render(<Tag tag={tag} />)
    
    expect(screen.getByText('Tag with @#$%^&*()')).toBeInTheDocument()
  })

  test('renders tag with long name', () => {
    const longName = 'This is a very long tag name that should be displayed properly without breaking the layout'
    const tag = { name: longName, color: '#FF5733' }
    render(<Tag tag={tag} />)
    
    expect(screen.getByText(longName)).toBeInTheDocument()
  })

  test('renders multiple tags correctly', () => {
    const tags = [
      { name: 'Tag 1', color: '#FF0000' },
      { name: 'Tag 2', color: '#00FF00' },
      { name: 'Tag 3', color: '#0000FF' },
    ]

    render(
      <div>
        <Tag tag={tags[0]} />
        <Tag tag={tags[1]} />
        <Tag tag={tags[2]} />
      </div>
    )
    
    expect(screen.getByText('Tag 1')).toBeInTheDocument()
    expect(screen.getByText('Tag 2')).toBeInTheDocument()
    expect(screen.getByText('Tag 3')).toBeInTheDocument()
  })

  test('applies correct styling classes', () => {
    const tag = { name: 'Test', color: '#FF5733' }
    render(<Tag tag={tag} />)
    
    const tagElement = screen.getByText('Test')
    expect(tagElement).toHaveClass('inline-flex', 'items-center', 'px-2', 'py-1', 'rounded-md', 'text-xs', 'font-medium', 'border', 'transition-all', 'duration-200')
  })

  test('applies selected styling when selected', () => {
    const tag = { name: 'Test Tag', color: '#FF5733' }
    render(<Tag tag={tag} selected={true} />)
    
    const tagElement = screen.getByText('Test Tag')
    expect(tagElement).toHaveClass('border-transparent', 'text-white')
  })

  test('applies unselected styling when not selected', () => {
    const tag = { name: 'Test Tag', color: '#FF5733' }
    render(<Tag tag={tag} selected={false} />)
    
    const tagElement = screen.getByText('Test Tag')
    expect(tagElement).toHaveClass('border-border', 'text-foreground', 'hover:border-primary')
  })

  test('handles null and undefined tag gracefully', () => {
    // Test with null tag
    expect(() => render(<Tag tag={null} />)).toThrow()
    
    // Test with undefined tag
    expect(() => render(<Tag tag={undefined} />)).toThrow()
  })

  test('handles tag without color', () => {
    const tag = { name: 'Test Tag' }
    render(<Tag tag={tag} />)
    
    expect(screen.getByText('Test Tag')).toBeInTheDocument()
  })

  test('handles tag without name', () => {
    const tag = { color: '#FF5733' }
    const { container } = render(<Tag tag={tag} />)
    
    // Check that the span element exists and has the correct structure
    const spanElement = container.querySelector('span')
    expect(spanElement).toBeInTheDocument()
    expect(spanElement.textContent).toBe('')
  })
}) 
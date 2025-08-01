import { render, screen, waitFor } from '@testing-library/react'
import QRCodeDisplay from '@/components/QRCodeDisplay'

// Mock the qrcode library
jest.mock('qrcode', () => ({
  toCanvas: jest.fn().mockResolvedValue(undefined)
}))

// Mock HTMLCanvasElement methods
beforeAll(() => {
  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,test')
  HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
    const blob = new Blob(['test'], { type: 'image/png' })
    callback(blob)
  })
})

describe('QRCodeDisplay', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render QR code with default props', async () => {
    render(<QRCodeDisplay value="test-filename" />)
    
    expect(screen.getByText('QR Code')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
    })
  })

  it('should render with custom title', async () => {
    render(<QRCodeDisplay value="test-filename" title="Section #001" />)
    
    await waitFor(() => {
      expect(screen.getByText('Section #001')).toBeInTheDocument()
    })
  })

  it('should show loading state initially', () => {
    render(<QRCodeDisplay value="test-filename" />)
    
    expect(screen.getByRole('generic')).toHaveClass('animate-spin')
  })

  it('should not render when value is empty', () => {
    const { container } = render(<QRCodeDisplay value="" />)
    
    expect(container.firstChild).toBeNull()
  })

  it('should truncate long values in display', async () => {
    const longValue = 'a'.repeat(100)
    render(<QRCodeDisplay value={longValue} />)
    
    await waitFor(() => {
      const truncatedText = screen.getByText(/aaa\.\.\./)
      expect(truncatedText).toBeInTheDocument()
    })
  })

  it('should show full value for short strings', async () => {
    const shortValue = 'short-filename'
    render(<QRCodeDisplay value={shortValue} />)
    
    await waitFor(() => {
      expect(screen.getByText(shortValue)).toBeInTheDocument()
    })
  })
})
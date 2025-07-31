import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FilenameGenerator from '@/components/FilenameGenerator'

// Mock fetch
global.fetch = jest.fn()

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

describe('FilenameGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the form correctly with new fields', () => {
    render(<FilenameGenerator />)
    
    expect(screen.getByText('QR Code, Brain section name generator')).toBeInTheDocument()
    expect(screen.getByLabelText('Brain ID')).toBeInTheDocument()
    expect(screen.getByLabelText('Local Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Slide ID')).toBeInTheDocument()
    expect(screen.getByLabelText('Series Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Start Section Number')).toBeInTheDocument()
    expect(screen.getByLabelText('End Section Number')).toBeInTheDocument()
    expect(screen.getByText('Generate Filenames')).toBeInTheDocument()
    expect(screen.getByText('QR Code')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<FilenameGenerator />)
    
    const submitButton = screen.getByText('Generate Filenames')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument()
    })
  })

  it('generates multiple filenames successfully', async () => {
    const mockResponse = {
      filenames: [
        { filename: 'B_BR001_Patient001-SL_1-ST_T1-SE_001', sectionNumber: 1, timestamp: '20240101T120000' },
        { filename: 'B_BR001_Patient001-SL_1-ST_T1-SE_002', sectionNumber: 2, timestamp: '20240101T120000' }
      ],
      totalCount: 2
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<FilenameGenerator />)
    
    fireEvent.change(screen.getByLabelText('Brain ID'), { target: { value: 'BR001' } })
    fireEvent.change(screen.getByLabelText('Local Name'), { target: { value: 'Patient001' } })
    fireEvent.change(screen.getByLabelText('Series Type'), { target: { value: 'T1' } })
    fireEvent.change(screen.getByLabelText('End Section Number'), { target: { value: '2' } })
    
    fireEvent.click(screen.getByText('Generate Filenames'))
    
    await waitFor(() => {
      expect(screen.getByText('B_BR001_Patient001-SL_1-ST_T1-SE_001')).toBeInTheDocument()
      expect(screen.getByText('B_BR001_Patient001-SL_1-ST_T1-SE_002')).toBeInTheDocument()
      expect(screen.getByText('Total: 2 filenames')).toBeInTheDocument()
    })
  })

  it('shows QR code when filename is selected', async () => {
    const mockResponse = {
      filenames: [
        { filename: 'B_BR001_Patient001-SL_1-ST_T1-SE_001', sectionNumber: 1, timestamp: '20240101T120000' }
      ],
      totalCount: 1
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<FilenameGenerator />)
    
    // Fill form and generate
    fireEvent.change(screen.getByLabelText('Brain ID'), { target: { value: 'BR001' } })
    fireEvent.change(screen.getByLabelText('Local Name'), { target: { value: 'Patient001' } })
    fireEvent.change(screen.getByLabelText('Series Type'), { target: { value: 'T1' } })
    fireEvent.click(screen.getByText('Generate Filenames'))
    
    await waitFor(() => {
      expect(screen.getByText('B_BR001_Patient001-SL_1-ST_T1-SE_001')).toBeInTheDocument()
    })

    // Click on filename to select it
    fireEvent.click(screen.getByText('B_BR001_Patient001-SL_1-ST_T1-SE_001'))
    
    await waitFor(() => {
      expect(screen.getByText('Section #001')).toBeInTheDocument()
      expect(screen.getByText('Selected')).toBeInTheDocument()
    })
  })

  it('validates section number ranges', async () => {
    render(<FilenameGenerator />)
    
    fireEvent.change(screen.getByLabelText('Brain ID'), { target: { value: 'BR001' } })
    fireEvent.change(screen.getByLabelText('Local Name'), { target: { value: 'Patient001' } })
    fireEvent.change(screen.getByLabelText('Series Type'), { target: { value: 'T1' } })
    fireEvent.change(screen.getByLabelText('Start Section Number'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('End Section Number'), { target: { value: '2' } })
    
    fireEvent.click(screen.getByText('Generate Filenames'))
    
    await waitFor(() => {
      expect(screen.getByText('Start section number cannot be greater than end section number')).toBeInTheDocument()
    })
  })

  it('shows filename count preview', () => {
    render(<FilenameGenerator />)
    
    fireEvent.change(screen.getByLabelText('End Section Number'), { target: { value: '5' } })
    
    expect(screen.getByText('Will generate 5 filename(s)')).toBeInTheDocument()
  })
})
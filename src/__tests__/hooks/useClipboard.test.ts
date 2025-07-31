import { renderHook, act } from '@testing-library/react'
import { useClipboard } from '@/hooks/useClipboard'

// Mock the clipboard API
const mockClipboard = {
  writeText: jest.fn(),
}

const mockExecCommand = jest.fn()

// Setup mocks
beforeEach(() => {
  jest.clearAllMocks()
  mockClipboard.writeText.mockResolvedValue(undefined)
  mockExecCommand.mockReturnValue(true)
})

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  configurable: true,
})

// Mock document.execCommand
Object.defineProperty(document, 'execCommand', {
  value: mockExecCommand,
  configurable: true,
})

// Mock document.queryCommandSupported
Object.defineProperty(document, 'queryCommandSupported', {
  value: jest.fn(() => true),
  configurable: true,
})

// Mock window.isSecureContext
Object.defineProperty(window, 'isSecureContext', {
  value: true,
  configurable: true,
})

describe('useClipboard', () => {
  it('should copy text using modern clipboard API', async () => {
    const onSuccess = jest.fn()
    const { result } = renderHook(() => useClipboard({ onSuccess }))

    let copyResult: boolean | undefined
    await act(async () => {
      copyResult = await result.current.copyToClipboard('test text')
    })

    expect(copyResult).toBe(true)
    expect(mockClipboard.writeText).toHaveBeenCalledWith('test text')
    expect(onSuccess).toHaveBeenCalledWith('test text')
    expect(result.current.lastCopiedText).toBe('test text')
  })

  it('should fallback to execCommand when clipboard API fails', async () => {
    // Mock clipboard API to not be available
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    })

    const onSuccess = jest.fn()
    const { result } = renderHook(() => useClipboard({ onSuccess }))

    // Mock document methods
    const mockTextArea = {
      value: '',
      style: {},
      setAttribute: jest.fn(),
      focus: jest.fn(),
      select: jest.fn(),
      setSelectionRange: jest.fn(),
    }

    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockTextArea as any)
    const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockTextArea as any)
    const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockTextArea as any)

    let copyResult: boolean | undefined
    await act(async () => {
      copyResult = await result.current.copyToClipboard('test text')
    })

    expect(copyResult).toBe(true)
    expect(createElementSpy).toHaveBeenCalledWith('textarea')
    expect(mockTextArea.value).toBe('test text')
    expect(mockTextArea.focus).toHaveBeenCalled()
    expect(mockTextArea.select).toHaveBeenCalled()
    expect(mockExecCommand).toHaveBeenCalledWith('copy')
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalledWith('test text')

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it('should handle copy failure', async () => {
    mockClipboard.writeText.mockRejectedValue(new Error('Copy failed'))

    const onError = jest.fn()
    const { result } = renderHook(() => useClipboard({ onError }))

    let copyResult: boolean | undefined
    await act(async () => {
      copyResult = await result.current.copyToClipboard('test text')
    })

    expect(copyResult).toBe(false)
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('should handle empty text', async () => {
    const onError = jest.fn()
    const { result } = renderHook(() => useClipboard({ onError }))

    let copyResult: boolean | undefined
    await act(async () => {
      copyResult = await result.current.copyToClipboard('')
    })

    expect(copyResult).toBe(false)
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: 'No text provided to copy'
    }))
  })

  it('should detect clipboard support correctly', () => {
    const { result } = renderHook(() => useClipboard())
    expect(result.current.isClipboardSupported).toBe(true)
  })

  it('should select text from element', () => {
    const mockElement = {
      focus: jest.fn(),
      select: jest.fn(),
      setSelectionRange: jest.fn(),
      value: 'test text'
    }

    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any)

    const { result } = renderHook(() => useClipboard())

    let selectResult: boolean | undefined
    act(() => {
      selectResult = result.current.selectText('test-element')
    })

    expect(selectResult).toBe(true)
    expect(mockElement.focus).toHaveBeenCalled()
    expect(mockElement.select).toHaveBeenCalled()
    expect(mockElement.setSelectionRange).toHaveBeenCalledWith(0, 9)
  })

  it('should handle text selection failure', () => {
    jest.spyOn(document, 'getElementById').mockReturnValue(null)

    const { result } = renderHook(() => useClipboard())

    let selectResult: boolean | undefined
    act(() => {
      selectResult = result.current.selectText('nonexistent-element')
    })

    expect(selectResult).toBe(false)
  })
})
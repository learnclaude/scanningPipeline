import { useState } from 'react'

interface UseClipboardOptions {
  onSuccess?: (text: string) => void
  onError?: (error: Error) => void
}

export function useClipboard(options: UseClipboardOptions = {}) {
  const [isCopying, setIsCopying] = useState(false)
  const [lastCopiedText, setLastCopiedText] = useState<string | null>(null)

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text) {
      const error = new Error('No text provided to copy')
      options.onError?.(error)
      return false
    }

    if (typeof window === 'undefined') {
      const error = new Error('Clipboard not available during server-side rendering')
      options.onError?.(error)
      return false
    }

    setIsCopying(true)

    try {
      // Method 1: Modern Clipboard API (requires HTTPS or localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        setLastCopiedText(text)
        options.onSuccess?.(text)
        return true
      }

      // Method 2: Legacy execCommand approach
      const textArea = document.createElement('textarea')
      textArea.value = text
      
      // Make textarea invisible but functional
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      textArea.setAttribute('readonly', '')
      textArea.style.opacity = '0'
      
      document.body.appendChild(textArea)
      
      // Focus and select the text
      textArea.focus()
      textArea.select()
      textArea.setSelectionRange(0, text.length)

      // Execute copy command
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)

      if (successful) {
        setLastCopiedText(text)
        options.onSuccess?.(text)
        return true
      } else {
        throw new Error('execCommand copy was unsuccessful')
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error)
      const clipboardError = error instanceof Error ? error : new Error('Unknown clipboard error')
      options.onError?.(clipboardError)
      return false
    } finally {
      setIsCopying(false)
    }
  }

  const selectText = (elementId: string): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      const element = document.getElementById(elementId) as HTMLInputElement | HTMLTextAreaElement
      if (element) {
        element.focus()
        element.select()
        
        // For mobile devices
        if (element.setSelectionRange) {
          element.setSelectionRange(0, element.value.length)
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Text selection failed:', error)
      return false
    }
  }

  const isClipboardSupported = (): boolean => {
    if (typeof window === 'undefined') return false
    return !!(navigator.clipboard || document.queryCommandSupported?.('copy'))
  }

  const getClipboardMethod = (): string => {
    if (typeof window === 'undefined') return 'none'
    if (navigator.clipboard && window.isSecureContext) {
      return 'modern'
    } else if (document.queryCommandSupported?.('copy')) {
      return 'legacy'
    } else {
      return 'none'
    }
  }

  return {
    copyToClipboard,
    selectText,
    isCopying,
    lastCopiedText,
    isClipboardSupported: isClipboardSupported(),
    clipboardMethod: getClipboardMethod()
  }
}
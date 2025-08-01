'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  value: string
  size?: number
  className?: string
  title?: string
}

export default function QRCodeDisplay({ 
  value, 
  size = 200, 
  className = '',
  title = 'QR Code'
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current || !value) return

      setIsLoading(true)
      setError(null)

      try {
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        })
      } catch (err) {
        console.error('Error generating QR code:', err)
        setError('Failed to generate QR code')
      } finally {
        setIsLoading(false)
      }
    }

    generateQRCode()
  }, [value, size])

  const downloadQRCode = () => {
    if (!canvasRef.current) return

    const link = document.createElement('a')
    link.download = `qr-code-${Date.now()}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  const copyQRCodeToClipboard = async () => {
    if (!canvasRef.current) return

    try {
      const canvas = canvasRef.current
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/png')
      })

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ])
        // You might want to show a toast here
      } else {
        throw new Error('Clipboard API not supported')
      }
    } catch (error) {
      console.error('Failed to copy QR code:', error)
      // Fallback: download the image
      downloadQRCode()
    }
  }

  if (!value) {
    return null
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        {isLoading && (
          <div 
            className="flex items-center justify-center bg-gray-100 rounded"
            style={{ width: size, height: size }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
        
        {error && (
          <div 
            className="flex items-center justify-center bg-red-50 text-red-500 text-sm rounded border border-red-200"
            style={{ width: size, height: size }}
          >
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          className={`${isLoading || error ? 'hidden' : 'block'} rounded`}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {!isLoading && !error && (
        <>
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
            <p className="text-xs text-gray-500 font-mono break-all max-w-xs">
              {value.length > 50 ? `${value.substring(0, 50)}...` : value}
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={copyQRCodeToClipboard}
              className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Copy QR code image"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
            
            <button
              onClick={downloadQRCode}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Download QR code"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
          </div>
        </>
      )}
    </div>
  )
}
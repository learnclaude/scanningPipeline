'use client'

import { useState, useEffect } from 'react'
import { FilenameGeneratorInput, GeneratedFilename, SeriesType } from '@/types'
import toast, { Toaster } from 'react-hot-toast'
import { useClipboard } from '@/hooks/useClipboard'
import QRCodeDisplay from './QRCodeDisplay'

export default function FilenameGenerator() {
  const [formData, setFormData] = useState<FilenameGeneratorInput>({
    brainId: '',
    localName: '',
    slideId: '1',
    seriesType: '',
    startSectionNumber: 1,
    endSectionNumber: 1,
    increment: 1,
  })
  const [generatedFilenames, setGeneratedFilenames] = useState<GeneratedFilename[]>([])
  const [selectedFilename, setSelectedFilename] = useState<GeneratedFilename | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [seriesTypes, setSeriesTypes] = useState<SeriesType[]>([])
  const [isLoadingSeriesTypes, setIsLoadingSeriesTypes] = useState(true)

  // Fetch series types from API
  useEffect(() => {
    const fetchSeriesTypes = async () => {
      try {
        const response = await fetch('http://apollo2.humanbrain.in:8000/masterconfig/Seriestype/?format=json', {
          headers: {
            'Authorization': 'Basic ' + btoa('admin:admin'),
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) {
          throw new Error('Failed to fetch series types')
        }
        const data = await response.json()
        setSeriesTypes(data)
      } catch (error) {
        console.error('Error fetching series types:', error)
        toast.error('Failed to load series types. Using default options.')
        // Fallback to default series types
        setSeriesTypes([
          { id: 1, name: 'T1 Weighted', mnemonic: 'T1' },
          { id: 2, name: 'T2 Weighted', mnemonic: 'T2' },
          { id: 3, name: 'FLAIR', mnemonic: 'FLAIR' },
          { id: 4, name: 'Diffusion Weighted Imaging', mnemonic: 'DWI' },
          { id: 5, name: 'Susceptibility Weighted Imaging', mnemonic: 'SWI' },
          { id: 6, name: 'Diffusion Tensor Imaging', mnemonic: 'DTI' },
        ])
      } finally {
        setIsLoadingSeriesTypes(false)
      }
    }

    fetchSeriesTypes()
  }, [])

  const { copyToClipboard, selectText, isCopying, isClipboardSupported, clipboardMethod } = useClipboard({
    onSuccess: (text) => {
      toast.success('Filename copied to clipboard!')
    },
    onError: (error) => {
      console.error('Clipboard error:', error)
      
      // Try to select the text as fallback
      const selected = selectText('generatedFilename')
      if (selected) {
        toast.error('Copy failed. Text has been selected - please press Ctrl+C (or Cmd+C on Mac)')
      } else {
        toast.error('Copy failed. Please manually select and copy the filename.')
      }
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Handle number inputs
    if (name === 'startSectionNumber' || name === 'endSectionNumber' || name === 'increment') {
      const numValue = parseInt(value) || 1
      setFormData(prev => {
        const newData = { ...prev, [name]: numValue }
        
        // Auto-fill slide ID based on start section number
        if (name === 'startSectionNumber') {
          newData.slideId = numValue.toString()
        }
        
        return newData
      })
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleGenerateFilename = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.brainId || !formData.localName || !formData.seriesType) {
      toast.error('Please fill in all fields')
      return
    }

    if (formData.startSectionNumber && formData.endSectionNumber && 
        formData.startSectionNumber > formData.endSectionNumber) {
      toast.error('Start section number cannot be greater than end section number')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/generate-filename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate filename')
      }

      const data = await response.json()
      setGeneratedFilenames(data.filenames)
      
      // Auto-increment slide ID and section numbers based on increment value for next generation
      const increment = formData.increment || 1
      const endSection = formData.endSectionNumber || 1
      const nextSlideId = (endSection + increment).toString()
      setFormData(prev => ({ 
        ...prev, 
        slideId: nextSlideId,
        startSectionNumber: endSection + increment,
        endSectionNumber: endSection + increment
      }))
      
      toast.success(`Generated ${data.totalCount} filename${data.totalCount > 1 ? 's' : ''} successfully!`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error generating filename')
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyToClipboard = async (filename: string) => {
    if (!filename) {
      toast.error('No filename to copy')
      return
    }

    await copyToClipboard(filename)
  }

  const handleCopyAllFilenames = async () => {
    if (!generatedFilenames.length) {
      toast.error('No filenames to copy')
      return
    }

    const allFilenames = generatedFilenames.map(item => item.filename).join('\n')
    await copyToClipboard(allFilenames)
    
    if (generatedFilenames.length > 1) {
      toast.success(`Copied all ${generatedFilenames.length} filenames to clipboard!`)
    }
  }

  const clearFilenames = () => {
    setGeneratedFilenames([])
    setSelectedFilename(null)
    toast.success('Filename list cleared')
  }

  const handleFilenameSelect = (filename: GeneratedFilename) => {
    setSelectedFilename(filename)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Brain Section [QR Code, Name generator]
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Generate standardized filenames for brain imaging data with QR codes
          </p>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="max-w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Left Column - Form */}
          <div className="bg-white shadow-xl rounded-lg px-8 py-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Generate Filenames
            </h2>

            <form onSubmit={handleGenerateFilename} className="space-y-6">
              <div>
                <label htmlFor="brainId" className="block text-sm font-medium text-gray-700">
                  Brain ID
                </label>
                <input
                  type="text"
                  id="brainId"
                  name="brainId"
                  value={formData.brainId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., BR001"
                  required
                />
              </div>

              <div>
                <label htmlFor="localName" className="block text-sm font-medium text-gray-700">
                  Local Name
                </label>
                <input
                  type="text"
                  id="localName"
                  name="localName"
                  value={formData.localName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Patient001"
                  required
                />
              </div>

              <div>
                <label htmlFor="slideId" className="block text-sm font-medium text-gray-700">
                  Slide ID
                </label>
                <input
                  type="text"
                  id="slideId"
                  name="slideId"
                  value={formData.slideId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Auto-fills from start section number, increments after generation
                </p>
              </div>

              <div>
                <label htmlFor="seriesType" className="block text-sm font-medium text-gray-700">
                  Series Type
                </label>
                <select
                  id="seriesType"
                  name="seriesType"
                  value={formData.seriesType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  disabled={isLoadingSeriesTypes}
                >
                  <option value="">
                    {isLoadingSeriesTypes ? 'Loading series types...' : 'Select series type'}
                  </option>
                  {seriesTypes.map((seriesType) => (
                    <option key={seriesType.id} value={seriesType.mnemonic}>
                      {seriesType.name} ({seriesType.mnemonic})
                    </option>
                  ))}
                </select>
                {isLoadingSeriesTypes && (
                  <p className="mt-1 text-xs text-gray-500">
                    Fetching series types from server...
                  </p>
                )}
              </div>


              {/* Section Number Range */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="startSectionNumber" className="block text-sm font-medium text-gray-700">
                    Start Section Number
                  </label>
                  <input
                    type="number"
                    id="startSectionNumber"
                    name="startSectionNumber"
                    value={formData.startSectionNumber}
                    onChange={handleInputChange}
                    min="1"
                    max="999"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endSectionNumber" className="block text-sm font-medium text-gray-700">
                    End Section Number
                  </label>
                  <input
                    type="number"
                    id="endSectionNumber"
                    name="endSectionNumber"
                    value={formData.endSectionNumber}
                    onChange={handleInputChange}
                    min="1"
                    max="999"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="increment" className="block text-sm font-medium text-gray-700">
                    Increment
                  </label>
                  <input
                    type="number"
                    id="increment"
                    name="increment"
                    value={formData.increment}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>
                  Will generate {formData.endSectionNumber && formData.startSectionNumber ? 
                    Math.max(0, Math.floor((formData.endSectionNumber - formData.startSectionNumber) / (formData.increment || 1)) + 1) : 1} filename(s)
                </p>
                <p className="mt-1">Increment: {formData.increment || 1} • Maximum 100 filenames per request</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </div>
                ) : (
                  'Generate Filenames'
                )}
              </button>
            </form>

            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-600">
                  Debug: Using {clipboardMethod} clipboard method
                </p>
                {!isClipboardSupported && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Clipboard not supported - text will be selected for manual copying
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Generated Filenames List */}
          <div className="bg-white shadow-xl rounded-lg px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Generated Filenames
              </h2>
              {generatedFilenames.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopyAllFilenames}
                    disabled={isCopying}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy All
                  </button>
                  <button
                    onClick={clearFilenames}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear
                  </button>
                </div>
              )}
            </div>

            {generatedFilenames.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No filenames generated</h3>
                <p className="mt-1 text-sm text-gray-500">Generate filenames using the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {generatedFilenames.map((item, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-3 rounded-md border-2 transition-all cursor-pointer ${
                      selectedFilename?.filename === item.filename
                        ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                        : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200'
                    }`}
                    onClick={() => handleFilenameSelect(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedFilename?.filename === item.filename
                            ? 'bg-indigo-200 text-indigo-900'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          #{item.sectionNumber.toString().padStart(3, '0')}
                        </span>
                        <code className="text-sm font-mono text-gray-900 truncate">
                          {item.filename}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedFilename?.filename === item.filename && (
                        <span className="text-indigo-600" title="Selected for QR code">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyToClipboard(item.filename)
                        }}
                        disabled={isCopying}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        title="Copy this filename"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {generatedFilenames.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Total: {generatedFilenames.length} filename{generatedFilenames.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Generated at: {generatedFilenames[0]?.timestamp && new Date(generatedFilenames[0].timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Third Column - QR Code Display */}
          <div className="bg-white shadow-xl rounded-lg px-8 py-8 xl:block lg:hidden block">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                QR Code
              </h2>
              {selectedFilename && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Selected
                </span>
              )}
            </div>

            {!selectedFilename ? (
              <div className="text-center py-16">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No filename selected</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Click on a filename from the list to generate its QR code
                </p>
                {generatedFilenames.length === 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    Generate filenames first using the form on the left
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <QRCodeDisplay 
                  value={selectedFilename.filename}
                  size={200}
                  title={`Section #${selectedFilename.sectionNumber.toString().padStart(3, '0')}`}
                  className="w-full"
                />
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Filename Details</h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Section Number:</span>
                      <span className="font-mono">#{selectedFilename.sectionNumber.toString().padStart(3, '0')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Generated:</span>
                      <span className="font-mono">
                        {new Date(selectedFilename.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-3">
                      <span>Full Filename:</span>
                      <div className="mt-1 p-2 bg-white border rounded font-mono text-xs break-all">
                        {selectedFilename.filename}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => handleCopyToClipboard(selectedFilename.filename)}
                    disabled={isCopying}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Filename
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile QR Code Display (shown when a filename is selected on mobile) */}
        {selectedFilename && (
          <div className="mt-8 xl:hidden">
            <div className="bg-white shadow-xl rounded-lg px-8 py-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  QR Code for Selected Filename
                </h2>
                <button
                  onClick={() => setSelectedFilename(null)}
                  className="text-gray-400 hover:text-gray-500"
                  title="Close QR code"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
                <div className="flex-shrink-0">
                  <QRCodeDisplay 
                    value={selectedFilename.filename}
                    size={200}
                    title={`Section #${selectedFilename.sectionNumber.toString().padStart(3, '0')}`}
                  />
                </div>
                
                <div className="flex-1 w-full">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Filename Details</h4>
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Section Number:</span>
                        <span className="font-mono">#{selectedFilename.sectionNumber.toString().padStart(3, '0')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Generated:</span>
                        <span className="font-mono">
                          {new Date(selectedFilename.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-3">
                        <span>Full Filename:</span>
                        <div className="mt-2 p-3 bg-white border rounded font-mono text-sm break-all">
                          {selectedFilename.filename}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <button
                      onClick={() => handleCopyToClipboard(selectedFilename.filename)}
                      disabled={isCopying}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Filename
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
import { POST } from '@/app/api/generate-filename/route'
import { NextRequest } from 'next/server'

describe('/api/generate-filename', () => {
  it('should generate a single filename with valid input', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/generate-filename', {
      method: 'POST',
      body: JSON.stringify({
        brainId: 'BR001',
        localName: 'Patient001',
        slideId: 'SL001',
        seriesType: 'T1',
        section: 'Axial',
      }),
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('filenames')
    expect(data).toHaveProperty('totalCount')
    expect(data.totalCount).toBe(1)
    expect(data.filenames).toHaveLength(1)
    expect(data.filenames[0]).toHaveProperty('filename')
    expect(data.filenames[0]).toHaveProperty('sectionNumber')
    expect(data.filenames[0]).toHaveProperty('timestamp')
    expect(data.filenames[0].filename).toMatch(/^B_BR001_Patient001-SL_SL001-ST_T1-SE_001$/)
    expect(data.filenames[0].sectionNumber).toBe(1)
  })

  it('should generate multiple filenames for section range', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/generate-filename', {
      method: 'POST',
      body: JSON.stringify({
        brainId: 'BR001',
        localName: 'Patient001',
        slideId: 'SL001',
        seriesType: 'T1',
        section: 'Axial',
        startSectionNumber: 5,
        endSectionNumber: 7,
      }),
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalCount).toBe(3)
    expect(data.filenames).toHaveLength(3)
    
    // Check first filename
    expect(data.filenames[0].filename).toMatch(/^B_BR001_Patient001-SL_SL001-ST_T1-SE_005$/)
    expect(data.filenames[0].sectionNumber).toBe(5)
    
    // Check last filename
    expect(data.filenames[2].filename).toMatch(/^B_BR001_Patient001-SL_SL001-ST_T1-SE_007$/)
    expect(data.filenames[2].sectionNumber).toBe(7)
  })

  it('should return 400 for missing fields', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/generate-filename', {
      method: 'POST',
      body: JSON.stringify({
        brainId: 'BR001',
        localName: 'Patient001',
        slideId: '',
        seriesType: 'T1',
        section: 'Axial',
      }),
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('Missing required fields')
  })

  it('should return 400 for invalid section number range', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/generate-filename', {
      method: 'POST',
      body: JSON.stringify({
        brainId: 'BR001',
        localName: 'Patient001',
        slideId: 'SL001',
        seriesType: 'T1',
        section: 'Axial',
        startSectionNumber: 10,
        endSectionNumber: 5,
      }),
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('Start section number cannot be greater than end section number')
  })

  it('should return 400 for negative section numbers', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/generate-filename', {
      method: 'POST',
      body: JSON.stringify({
        brainId: 'BR001',
        localName: 'Patient001',
        slideId: 'SL001',
        seriesType: 'T1',
        section: 'Axial',
        startSectionNumber: -1,
        endSectionNumber: 5,
      }),
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('Section numbers must be positive integers')
  })

  it('should return 400 for too large range', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/generate-filename', {
      method: 'POST',
      body: JSON.stringify({
        brainId: 'BR001',
        localName: 'Patient001',
        slideId: 'SL001',
        seriesType: 'T1',
        section: 'Axial',
        startSectionNumber: 1,
        endSectionNumber: 101,
      }),
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('Maximum range allowed is 100 sections')
  })

  it('should clean special characters from input', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/generate-filename', {
      method: 'POST',
      body: JSON.stringify({
        brainId: 'BR-001!',
        localName: 'Patient-002!',
        slideId: 'SL@001#',
        seriesType: 'T1@#',
        section: 'Axial_Test',
      }),
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.filenames[0].filename).toMatch(/^B_BR001_Patient002-SL_SL001-ST_T1-SE_001$/)
  })

  it('should pad section numbers with zeros', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/generate-filename', {
      method: 'POST',
      body: JSON.stringify({
        brainId: 'BR001',
        localName: 'Patient001',
        slideId: 'SL001',
        seriesType: 'T1',
        section: 'Axial',
        startSectionNumber: 1,
        endSectionNumber: 1,
      }),
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.filenames[0].filename).toMatch(/^B_BR001_Patient001-SL_SL001-ST_T1-SE_001$/)
  })
})
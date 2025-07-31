import { NextRequest, NextResponse } from 'next/server'
import { FilenameGeneratorInput, FilenameGeneratorResponse, GeneratedFilename } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: FilenameGeneratorInput = await request.json()
    
    // Validate input
    if (!body.brainId || !body.localName || !body.slideId || !body.seriesType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate section numbers and increment if provided
    const startSection = body.startSectionNumber || 1
    const endSection = body.endSectionNumber || 1
    const increment = body.increment || 1

    if (startSection > endSection) {
      return NextResponse.json(
        { error: 'Start section number cannot be greater than end section number' },
        { status: 400 }
      )
    }

    if (startSection < 1 || endSection < 1 || increment < 1) {
      return NextResponse.json(
        { error: 'Section numbers and increment must be positive integers' },
        { status: 400 }
      )
    }

    // Calculate how many filenames will be generated
    const totalFilenames = Math.floor((endSection - startSection) / increment) + 1
    
    // Limit the range to prevent abuse
    const maxRange = 100
    if (totalFilenames > maxRange) {
      return NextResponse.json(
        { error: `Maximum range allowed is ${maxRange} filenames` },
        { status: 400 }
      )
    }

    // Generate timestamp (same for all filenames in this request)
    const timestamp = new Date().toISOString().replace(/[:-]/g, '').split('.')[0]
    
    // Clean and format inputs
    const cleanBrainId = body.brainId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    const cleanLocalName = body.localName.trim().replace(/[^A-Za-z0-9]/g, '')
    const baseSlideId = parseInt(body.slideId.trim().replace(/[^0-9]/g, '')) || 1
    const cleanSeriesType = body.seriesType.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    // Generate filenames for each section number with incrementing slide IDs
    const filenames: GeneratedFilename[] = []
    let slideIdCounter = 0
    
    for (let sectionNum = startSection; sectionNum <= endSection; sectionNum += increment) {
      const paddedSectionNum = sectionNum.toString().padStart(3, '0') // Pad with zeros for consistent sorting
      const currentSlideId = baseSlideId + slideIdCounter
      const paddedSlideId = currentSlideId.toString().padStart(3, '0')
      
      // Generate filename format: B_<BRAINID>_<LocalNAME>-SL_<SLIDEID>-ST_<seriestype>-SE_<sectionno>
      const filename = `B_${cleanBrainId}_${cleanLocalName}-SL_${paddedSlideId}-ST_${cleanSeriesType}-SE_${paddedSectionNum}`
      
      filenames.push({
        filename,
        sectionNumber: sectionNum,
        slideNumber: currentSlideId,
        timestamp
      })
      
      slideIdCounter += increment
    }
    
    const response: FilenameGeneratorResponse = {
      filenames,
      totalCount: filenames.length
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating filename:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
export interface FilenameGeneratorInput {
  brainId: string
  localName: string
  slideId: string
  seriesType: string
  startSectionNumber?: number
  endSectionNumber?: number
  increment?: number
}

export interface GeneratedFilename {
  filename: string
  sectionNumber: number
  slideNumber: number
  timestamp: string
}

export interface FilenameGeneratorResponse {
  filenames: GeneratedFilename[]
  totalCount: number
}

export interface SeriesType {
  id: number
  name: string
  mnemonic: string
  description?: string
}
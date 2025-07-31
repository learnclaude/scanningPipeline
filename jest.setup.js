import '@testing-library/jest-dom'

// Mock Next.js runtime APIs for testing
global.Response = Response
global.Request = Request
global.Headers = Headers
global.fetch = fetch

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url, init) {
      this.url = url
      this.method = init?.method || 'GET'
      this.body = init?.body
      this.headers = new Map()
    }
    
    async json() {
      return JSON.parse(this.body || '{}')
    }
  },
  NextResponse: {
    json: (data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}))
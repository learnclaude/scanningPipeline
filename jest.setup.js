import '@testing-library/jest-dom'

// Mock Next.js runtime APIs for testing
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Simple mocks for Web APIs
global.Response = class Response {
  constructor(body, init) {
    Object.assign(this, init)
    this._body = body
  }
  async json() { return JSON.parse(this._body) }
  async text() { return this._body }
}

// Mock Request class needed by NextRequest
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init = {}) {
      this._url = url
      this.method = init.method || 'GET'
      this._headers = new Map()
      this.body = init.body
    }
    
    get url() { return this._url }
    
    async json() {
      return JSON.parse(this.body || '{}')
    }
    
    async text() {
      return this.body || ''
    }
  }
}

global.Headers = class Headers {
  constructor(init) {
    this._headers = new Map()
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this._headers.set(key.toLowerCase(), value)
      })
    }
  }
  get(name) { return this._headers.get(name.toLowerCase()) }
  set(name, value) { this._headers.set(name.toLowerCase(), value) }
}

global.fetch = jest.fn()

// Mock matchMedia for react-hot-toast
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url, init) {
      Object.defineProperty(this, 'url', {
        value: url,
        writable: false
      })
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
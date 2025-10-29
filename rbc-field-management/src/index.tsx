import './index.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

// Suppress ResizeObserver loop warnings - this is a known browser quirk that's harmless
const originalError = window.console.error
window.console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    return
  }
  originalError.apply(console, args)
}

// Also suppress ResizeObserver errors in global error handler
const originalOnError = window.onerror
window.onerror = (message, source, lineno, colno, error) => {
  if (
    typeof message === 'string' &&
    message.includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    return true // Prevent default error handling
  }
  if (originalOnError) {
    return originalOnError.call(window, message, source, lineno, colno, error)
  }
  return false
}

// Suppress unhandled promise rejections related to ResizeObserver
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    typeof event.reason === 'object' &&
    typeof event.reason.message === 'string' &&
    event.reason.message.includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    event.preventDefault()
  }
})

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<App />)

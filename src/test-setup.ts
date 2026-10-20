import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest globals kapalı olduğundan Testing Library otomatik temizlik yapmıyor.
afterEach(cleanup)

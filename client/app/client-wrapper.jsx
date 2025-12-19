'use client'

import { Providers } from './providers'
import AppLayout from './app-layout'

export default function ClientWrapper({ children }) {
  return (
    <Providers>
      <AppLayout>{children}</AppLayout>
    </Providers>
  )
}


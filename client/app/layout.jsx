import { Montserrat } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
})

export const metadata = {
  title: 'Hack Running!',
  description: 'Aplicativo de corrida e comunidade',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={montserrat.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}


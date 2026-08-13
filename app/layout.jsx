import './globals.css'
import { ThemeProvider } from './lib/ThemeContext'

export const metadata = {
  title: 'Podcast Player',
  description: 'Listen to your favorite podcasts',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

import './globals.css'

export const metadata = {
  title: 'Podcast Player',
  description: 'Listen to your favorite podcasts',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

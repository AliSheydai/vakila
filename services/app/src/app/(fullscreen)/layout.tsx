export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='video-call-page min-h-dvh bg-background font-sans' dir='rtl'>
      {children}
    </div>
  )
}

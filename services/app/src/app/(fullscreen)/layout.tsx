export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className='min-h-dvh bg-background'>{children}</div>
}

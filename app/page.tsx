import { Shell } from '@/components/Shell'
import { SystemProvider } from '@/lib/system'

export default function Page() {
  return (
    <SystemProvider>
      <Shell />
    </SystemProvider>
  )
}

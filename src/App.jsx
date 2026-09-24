import { Routes, Route, Navigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Landmark } from 'lucide-react'
import { ThemeProvider } from '@/theme/ThemeContext'
import { AppShell } from '@/components/AppShell'
import Dashboard from '@/pages/Dashboard'
import AccountDetail from '@/pages/AccountDetail'
import Transfer from '@/pages/Transfer'
import About from '@/pages/About'

// A bank teller / admin console. Every balance is derived by folding an
// append-only ledger, and money is exact integer minor units — never a float.
const NAV = [
  { to: '/', label: 'Accounts', end: true },
  { to: '/transfer', label: 'Transfer' },
  { to: '/about', label: 'Integrity' },
]

export default function App() {
  return (
    <ThemeProvider>
      {/* All framer-motion honours the OS "reduce motion" setting. */}
      <MotionConfig reducedMotion="user">
        <Routes>
          <Route element={<AppShell title="Banking" mark={Landmark} nav={NAV} />}>
            <Route index element={<Dashboard />} />
            <Route path="account/:id" element={<AccountDetail />} />
            <Route path="transfer" element={<Transfer />} />
            <Route path="about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </MotionConfig>
    </ThemeProvider>
  )
}

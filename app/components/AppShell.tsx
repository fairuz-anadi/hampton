import Link from 'next/link'

export function AppShell({ active, children }: { active: 'grade' | 'you' | 'student', children: React.ReactNode }) {
  return <main className="shell">
    <header className="topbar"><Link className="brand" href="/">NORM<span>·</span></Link><nav aria-label="Main navigation">
      <Link className={active === 'grade' ? 'active' : ''} href="/">Grade</Link>
      <Link className={active === 'you' ? 'active' : ''} href="/you">You</Link>
      <Link className={active === 'student' ? 'active' : ''} href="/student">Student</Link>
    </nav><span className="exam-label">Algorithms · Midterm</span></header>
    {children}
  </main>
}

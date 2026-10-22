import { Link } from 'react-router-dom'

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="appbar">
      <Link to="/" className="brand" aria-label="Arnifi Marketing Studio, home">
        <img src="/brand/arnifi-logo.svg" alt="Arnifi" width={107} height={30} />
        <span className="brand__divider" aria-hidden="true" />
        <span className="brand__name">Marketing Studio</span>
      </Link>
      {children}
    </header>
  )
}

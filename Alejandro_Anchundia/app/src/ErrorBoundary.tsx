import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="shell">
          <main className="hero">
            <p className="eyebrow">Pura Vida</p>
            <h1>Algo salió mal</h1>
            <p className="lede">
              No pudimos cargar tu cuenta. Recarga la página y vuelve a conectar la wallet.
            </p>
          </main>
        </div>
      )
    }
    return this.props.children
  }
}

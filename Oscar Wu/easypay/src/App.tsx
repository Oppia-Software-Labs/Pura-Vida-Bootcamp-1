import { useEffect, useState } from 'react'
import AppScreen from './AppScreen'
import Landing from './Landing'

// Ruteo simple por hash: "#/" = landing, "#/app" = aplicación.
// Se usa hash para que funcione en cualquier hosting estático sin reglas de rewrite.
export default function App() {
  const [route, setRoute] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => {
      setRoute(window.location.hash)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route.startsWith('#/app') ? <AppScreen /> : <Landing />
}

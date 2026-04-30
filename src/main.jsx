import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useUser } from '@clerk/react'
import './index.css'
import { ThemeProvider } from './ThemeContext.jsx'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import SignInPage from './pages/SignInPage.jsx'
// import SignUpPage from './pages/SignUpPage.jsx'

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useUser()
  if (!isLoaded) return null
  if (!isSignedIn) return <Navigate to="/sign-in" replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { isSignedIn, isLoaded } = useUser()
  if (!isLoaded) return null
  if (isSignedIn) return <Navigate to="/home" replace />
  return children
}

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      // signUpUrl="/sign-up"
      signInForceRedirectUrl="/home"
      // signUpForceRedirectUrl="/home"
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicOnlyRoute><App /></PublicOnlyRoute>} />
          <Route path="/sign-in" element={
            <PublicOnlyRoute><SignInPage /></PublicOnlyRoute>
          } />
          {/* <Route path="/sign-up" element={
            <PublicOnlyRoute><SignUpPage /></PublicOnlyRoute>
          } /> */}
          <Route path="/home" element={
            <ProtectedRoute><Home /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
    </ThemeProvider>
  </StrictMode>,
)

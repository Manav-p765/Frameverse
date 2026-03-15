import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

// Global debug helper to print current active user
window.printCurrentUser = () => {
  const user = localStorage.getItem("user");
  if (user) {
    console.log("Current Active User:", JSON.parse(user));
  } else {
    console.log("No active user found in localStorage.");
  }
};

const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((m) => ({ default: m.Analytics }))
)
const SpeedInsights = lazy(() =>
  import('@vercel/speed-insights/react').then((m) => ({ default: m.SpeedInsights }))
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        {import.meta.env.PROD && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </Suspense>
      <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
        <App />
      </GoogleReCaptchaProvider>
    </BrowserRouter>
  </StrictMode >
)
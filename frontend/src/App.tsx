import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import PDFGenerator, { type FormData } from "./PDFGenerator";
import PDFPreview from "./PDFPreview";

const FORM_DATA_KEY = "tsp_form_data";

export interface UserProfile {
  name: string;
  email: string;
  id: string;
}

function AppContent() {
  const navigate = useNavigate();
  const didInitRef = useRef(false);
  const aasRef = useRef<any>(null);

  // ── State ──
  const [formData, setFormData] = useState<FormData | null>(() => {
    const saved = sessionStorage.getItem(FORM_DATA_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // ── Init AAS (Conditional) ──
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const initAuth = async () => {
      if (!window.AAS) return;

      // Check if the URL contains Keycloak callback parameters.
      // If NOT, we assume it's a fresh start and do NOT initialize auth.
      // This keeps the user in "Guest Mode" until they explicitly click Sign.
      const currentUrl = window.location.href;
      const isReturningFromLogin =
        (currentUrl.includes("code=") && currentUrl.includes("state=")) ||
        (currentUrl.includes("#state=") && currentUrl.includes("&code="));

      if (!isReturningFromLogin) {
        console.log(
          "App started. No login callback detected. Staying as Guest.",
        );
        return;
      }

      try {
        const aas = window.AAS("aas.json");
        aasRef.current = aas;

        // here we only run this if we detected the code/state in the URL
        const loggedIn = await aas.init({
          onLoad: "check-sso",
          checkLoginIframe: false,
        });

        if (loggedIn) {
          console.log("✅ Login flow completed!");
          setIsAuthenticated(true);
          setToken(aas.getToken());

          const parsed = aas.getTokenParsed();
          setUserProfile({
            name: aas.getFullName() || parsed.preferred_username,
            email: parsed.email || "No Email",
            id: aas.getUserId(),
          });

          // Clean the ugly URL parameters
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      } catch (error) {
        console.error("Auth init failed:", error);
      }
    };

    initAuth();
  }, []);

  // ── Handlers ──

  const handleFormSubmit = (data: FormData) => {
    sessionStorage.setItem(FORM_DATA_KEY, JSON.stringify(data));
    setFormData(data);
    navigate("/preview");
  };

  const handleBack = () => {
    navigate("/");
  };
  const handleLogout = () => {
    // 1. Clear local state immediately
    setIsAuthenticated(false);
    setUserProfile(null);
    setToken(null);

    // 2. Perform Server Logout
    if (aasRef.current) {
      // Pass redirectUri so Keycloak sends us back HERE instead of the TSP Portal
      aasRef.current.logout({
        redirectUri: window.location.href,
      });
    } else {
      // Fallback if ref is missing: Create instance and logout
      const aas = window.AAS("aas.json");
      aas.logout({
        redirectUri: window.location.href,
      });
    }
  };

  console.log("token is :", token);

  return (
    <Routes>
      <Route path="/" element={<PDFGenerator onSubmit={handleFormSubmit} />} />

      <Route
        path="/preview"
        element={
          formData ? (
            <PDFPreview
              data={formData}
              onBack={handleBack}
              isAuthenticated={isAuthenticated}
              userProfile={userProfile}
              token={token}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

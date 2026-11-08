import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import ProfileFormPage from "../features/profile/ProfileFormPage";
import type { ProfileData } from "../features/profile/profileForm";
import { loadProfile, saveProfile } from "../features/profile/profileStorage";
import DocumentPreviewPage from "../features/signing/DocumentPreviewPage";
import { ROUTES } from "./routes";

function AppRoutes() {
  const navigate = useNavigate();
  // Restored after the login redirect, which reloads the page.
  const [profile, setProfile] = useState<ProfileData | null>(loadProfile);

  const handleSubmit = (submitted: ProfileData) => {
    saveProfile(submitted);
    setProfile(submitted);
    navigate(ROUTES.preview);
  };

  return (
    <Routes>
      <Route
        path={ROUTES.form}
        element={<ProfileFormPage onSubmit={handleSubmit} initialData={profile} />}
      />
      <Route
        path={ROUTES.preview}
        element={
          profile ? (
            <DocumentPreviewPage profile={profile} onBack={() => navigate(ROUTES.form)} />
          ) : (
            <Navigate to={ROUTES.form} replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.form} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

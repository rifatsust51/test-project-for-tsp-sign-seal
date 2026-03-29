import { useState } from "react";
import type { UserProfile } from "./App";
import type { FormData } from "./PDFGenerator";
import {
  adminSignFileService,
  base64ToBlob,
  generatePdfBase64,
  signFileService,
  verifyFileService,
} from "./apiUtils";

interface PDFPreviewProps {
  data: FormData;
  onBack: () => void;
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  token: string | null;
  onLogout: () => void;
}

interface RowProps {
  label: string;
  value: string;
}

function Row({ label, value }: RowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-stone-100 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-widest text-stone-400 sm:w-48 shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-stone-800 mt-0.5 sm:mt-0">
        {value || "—"}
      </span>
    </div>
  );
}

export default function PDFPreview({
  data,
  onBack,
  isAuthenticated,
  userProfile,
  token,
  onLogout,
}: PDFPreviewProps) {
  const [signatureDate] = useState(new Date().toLocaleDateString("en-GB"));
  const [refNumber] = useState(() => Date.now().toString().slice(-6));

  // State for process tracking
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isAdminSigned, setIsAdminSigned] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [finalFileName, setFinalFileName] = useState("");

  const formatSalary = (val: string) => {
    const num = val.replace(/,/g, "");
    return isNaN(Number(num)) ? val : `BDT ${Number(num).toLocaleString()}`;
  };

  const formatDOB = (val: string) => {
    if (!val) return "—";
    const d = new Date(val);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    if (signedPdfUrl && finalFileName) {
      const link = document.createElement("a");
      link.href = signedPdfUrl;
      link.download = `Signed_${finalFileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const safeName = data.fullName.replace(/\s+/g, "_");
  const fileName = `Profile_${safeName}.pdf`;

  const handleAdminSign = async () => {
    const base64pdf = generatePdfBase64(data);
    const adminSignResponse = await adminSignFileService(base64pdf, fileName);
    console.log(
      "🚀 ~ PDFPreview.tsx:381 ~ handleAdminSign ~ adminSignResponse:",
      adminSignResponse,
    );

    const blob = base64ToBlob(adminSignResponse?.data?.signedData);
    const url = window.URL.createObjectURL(blob);
    setSignedPdfUrl(url);
    setFinalFileName(fileName);
    setIsAdminSigned(true);
    alert("✅ Document Signed by Admin successfully!");
  };

  const handleActionClick = async () => {
    if (isAuthenticated && userProfile?.id) {
      try {
        setIsProcessing(true);
        setIsVerified(false);
        setSignedPdfUrl(null);

        setStatusMessage("Generating PDF...");

        setFinalFileName(fileName);

        const base64Pdf = generatePdfBase64(data);

        setStatusMessage("Signing Document...");
        const signResponse = await signFileService(
          base64Pdf,
          userProfile.id,
          fileName,
          token!,
        );
        const signedData =
          signResponse.data?.signedData || signResponse.signedData;
        console.log(
          "🚀 ~ PDFPreview.tsx:397 ~ handleActionClick ~ signedData:",
          signedData,
        );

        if (!signedData) throw new Error("No signed data received");

        setStatusMessage("Verifying Signature...");
        const verifyResponse = await verifyFileService(signedData, fileName);

        if (verifyResponse.code === 0 && verifyResponse.message === "Success") {
          const blob = base64ToBlob(signedData);
          const url = window.URL.createObjectURL(blob);
          setSignedPdfUrl(url);
          setIsVerified(true);
          setStatusMessage("Verified & Ready");
          alert("✅ Document Signed & Verified successfully!");
        } else {
          setStatusMessage("Verification Failed");
          alert("⚠️ Signature applied, but verification failed.");
        }
      } catch (error: any) {
        console.error("Process failed:", error);
        alert(`Error: ${error.message || "Unknown error"}`);
        setStatusMessage("Error Occurred");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (!window.AAS) {
      alert("SDK Missing");
      return;
    }

    try {
      const aasInstance = window.AAS("aas.json");
      await aasInstance.init({
        onLoad: "login-required",
        checkLoginIframe: false,
        redirectUri: window.location.href,
      });
    } catch (error) {
      console.error("Login redirect error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* ─── LEFT SIDEBAR ─── */}
      <div className="w-full md:w-64 bg-white border-r border-stone-200 p-6 flex flex-col md:fixed md:h-full z-10">
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
            User Profile
          </h2>
          {isAuthenticated && userProfile ? (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3 shadow-md">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <p className="font-bold text-stone-800 text-sm truncate">
                {userProfile.name}
              </p>
              <p className="text-xs text-stone-500 truncate mb-4">
                {userProfile.email}
              </p>
              <button
                onClick={onLogout}
                className="w-full text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded transition-colors border border-red-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 text-center">
              <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center text-stone-400 mx-auto mb-3">
                ?
              </div>
              <p className="text-sm font-medium text-stone-500">
                Not Logged In
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto hidden md:block">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm font-medium transition-colors"
          >
            <span>←</span> Back to Form
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 p-6 md:ml-64">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6 md:justify-end gap-3">
            <button
              onClick={onBack}
              className="md:hidden text-stone-500 text-sm font-medium"
            >
              ← Back
            </button>

            {/* Download Button: Enabled only if isVerified is true */}
            <button
              onClick={handleDownload}
              disabled={!isVerified && !isAdminSigned}
              className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all shadow
                ${
                  isVerified || isAdminSigned
                    ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}
            >
              <span>📥</span> Download Signed PDF
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg transition-colors shadow"
            >
              <span>🖨</span> Print
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400" />
            <div className="p-10">
              <div className="flex items-start justify-between mb-10 pb-8 border-b-2 border-stone-800">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-500 mb-1">
                    Official Document
                  </p>
                  <h1
                    className="text-3xl font-black text-stone-900"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >
                    Employee Profile
                  </h1>
                  <p className="text-stone-400 text-xs mt-1.5">
                    Ref: EMP-{refNumber}
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-black shadow-md">
                    {data.fullName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <p className="text-xs text-stone-400 mt-2">
                    Issued: {signatureDate}
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mb-4 flex items-center gap-2">
                    <span className="w-4 h-px bg-amber-400" /> Personal
                    Information
                  </h2>
                  <div className="bg-stone-50 rounded-xl px-6 py-1 border border-stone-100">
                    <Row label="Full Name" value={data.fullName} />
                    <Row label="Email Address" value={data.email} />
                    <Row label="Phone Number" value={data.phoneNumber} />
                    <Row label="Date of Birth" value={formatDOB(data.dob)} />
                    <Row label="National ID (NID)" value={data.nid} />
                  </div>
                </div>

                <div>
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mb-4 flex items-center gap-2">
                    <span className="w-4 h-px bg-amber-400" /> Employment
                    Details
                  </h2>
                  <div className="bg-stone-50 rounded-xl px-6 py-1 border border-stone-100">
                    <Row
                      label="Current Salary"
                      value={formatSalary(data.currentSalary)}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mb-4 flex items-center gap-2">
                    <span className="w-4 h-px bg-amber-400" /> Emergency Contact
                  </h2>
                  <div className="bg-stone-50 rounded-xl px-6 py-1 border border-stone-100">
                    <Row
                      label="Contact Name"
                      value={data.emergencyContactName}
                    />
                    <Row
                      label="Contact Number"
                      value={data.emergencyContactNumber}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-300">
                <span>Confidential — For Internal Use Only</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-2xl p-8 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-stone-400 text-xs uppercase tracking-[0.2em] font-bold mb-1">
                {isVerified
                  ? "✅ Verified"
                  : `Status: ${isAuthenticated ? "Authenticated" : "Guest"}`}
              </p>
              <h3 className="text-stone-800 font-bold">
                {isProcessing
                  ? statusMessage
                  : isVerified
                    ? "Document Signed"
                    : isAuthenticated
                      ? "Ready to Sign"
                      : "Authorization Required"}
              </h3>
            </div>

            <button
              onClick={handleActionClick}
              disabled={isProcessing || isVerified}
              className={`group relative flex items-center gap-3 border px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95
                ${isProcessing ? "bg-stone-100 cursor-wait text-stone-400" : isVerified ? "bg-stone-50 border-green-500 text-green-600 cursor-default" : isAuthenticated ? "bg-green-600 border-green-600 hover:bg-green-700 text-white" : "bg-white border-stone-200 hover:border-amber-400 text-stone-700"}`}
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 ${isProcessing ? "bg-stone-200" : isVerified ? "bg-green-100 text-green-600" : isAuthenticated ? "bg-white text-green-600" : "bg-amber-100 text-amber-600"}`}
              >
                {isProcessing
                  ? "↻"
                  : isVerified
                    ? "✓"
                    : isAuthenticated
                      ? "🖋️"
                      : "🖋️"}
              </span>
              <span className="text-sm font-bold uppercase tracking-widest">
                {isProcessing
                  ? "Processing..."
                  : isVerified
                    ? "Successfully Signed"
                    : isAuthenticated
                      ? "Complete Signature"
                      : "Log in & Sign"}
              </span>
            </button>
            <button
              onClick={handleAdminSign}
              className=" gap-3 border px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95"
            >
              {" "}
              Admin Sign{" "}
            </button>

            {isVerified && (
              <p className="text-[10px] text-green-600 font-medium">
                Signature verified. Use the download button above to save the
                file.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

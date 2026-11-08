import { useAuth } from "../../auth/authContext";
import FlowStepper from "../../components/FlowStepper";
import { ArrowLeftIcon, PrinterIcon } from "../../components/icons";
import type { ProfileData } from "../profile/profileForm";
import PreviewSidebar from "./PreviewSidebar";
import ProfileDocument from "./ProfileDocument";
import SigningPanel from "./SigningPanel";
import { useDocumentSigning } from "./useDocumentSigning";

interface DocumentPreviewPageProps {
  profile: ProfileData;
  onBack: () => void;
}

const secondaryButton =
  "inline-flex h-10 items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-700 shadow-[0_1px_0_rgb(0_0_0/0.03)] transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500";

export default function DocumentPreviewPage({ profile, onBack }: DocumentPreviewPageProps) {
  const { user, logout } = useAuth();
  const signing = useDocumentSigning(profile);
  const { view } = signing;

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 antialiased lg:grid lg:grid-cols-[minmax(340px,400px)_1fr] print:block print:bg-white">
      <PreviewSidebar
        profileName={profile.fullName}
        user={user}
        view={view}
        onBack={onBack}
        onLogout={logout}
      />

      <main className="px-4 py-8 sm:px-8 lg:px-12 lg:py-12 print:p-0">
        <div className="mx-auto max-w-5xl">
          <div className="print:hidden">
            <FlowStepper current={view.isSigned ? 2 : 1} currentDone={view.isSigned} />

            <header className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between motion-safe:animate-rise">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                  Document preview
                </p>
                <h1 className="font-display mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
                  Review <span className="font-sans">&amp;</span> sign
                </h1>
                <p className="mt-2 text-[15px] text-stone-600">
                  Check every detail before signing. Need a change? Edit your details first.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={onBack} className={secondaryButton}>
                  <ArrowLeftIcon className="size-4" />
                  Edit details
                </button>
                <button type="button" onClick={() => window.print()} className={secondaryButton}>
                  <PrinterIcon className="size-4" />
                  Print
                </button>
              </div>
            </header>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start print:mt-0 print:block">
            <ProfileDocument profile={profile} />
            <SigningPanel
              state={signing.state}
              view={view}
              isAuthenticated={user !== null}
              canDownload={signing.canDownload}
              onSignAsUser={() => void signing.signAsCurrentUser()}
              onSignAsAdmin={() => void signing.signAsOrganisation()}
              onDownload={signing.downloadSignedPdf}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

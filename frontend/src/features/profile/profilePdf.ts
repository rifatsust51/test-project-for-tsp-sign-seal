import type { ProfileData } from "./profileForm";

const MARGIN_X = 20;

/**
 * Renders the profile as a one-page PDF and returns its contents as base64.
 * jsPDF is loaded on demand so it stays out of the initial bundle.
 */
export async function generateProfilePdfBase64(profile: ProfileData): Promise<string> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("Employee Profile", MARGIN_X, 20);

  doc.setFontSize(12);
  const lines: [string, number][] = [
    [`Full Name: ${profile.fullName}`, 40],
    [`Email: ${profile.email}`, 50],
    [`Phone: ${profile.phoneNumber}`, 60],
    [`NID: ${profile.nid}`, 70],
    [`Salary: ${profile.currentSalary}`, 80],
    [`Emergency Contact: ${profile.emergencyContactName} (${profile.emergencyContactNumber})`, 90],
    [`Generated on: ${new Date().toLocaleString()}`, 110],
  ];
  for (const [text, y] of lines) doc.text(text, MARGIN_X, y);

  const dataUri = doc.output("datauristring");
  return dataUri.slice(dataUri.indexOf(",") + 1);
}

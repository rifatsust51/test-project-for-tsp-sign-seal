import { jsPDF } from "jspdf";
import type { FormData } from "./PDFGenerator";

const BASE_URL = "https://192.168.0.155:8443/tspgatewayservice/gateway";

// 1. Helper: Generate Base64 PDF
export const generatePdfBase64 = (data: FormData): string => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("Employee Profile", 20, 20);
  doc.setFontSize(12);
  doc.text(`Full Name: ${data.fullName}`, 20, 40);
  doc.text(`Email: ${data.email}`, 20, 50);
  doc.text(`Phone: ${data.phoneNumber}`, 20, 60);
  doc.text(`NID: ${data.nid}`, 20, 70);
  doc.text(`Salary: ${data.currentSalary}`, 20, 80);
  doc.text(
    `Emergency Contact: ${data.emergencyContactName} (${data.emergencyContactNumber})`,
    20,
    90,
  );
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 110);

  const dataUri = doc.output("datauristring");
  return dataUri.split(",")[1];
};

// 2. Helper: Base64 to Blob
export const base64ToBlob = (base64: string): Blob => {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
};

// 3. API: Sign File (NOW ACCEPTS fileName)
export const signFileService = async (
  base64Pdf: string,
  userId: string,
  fileName: string,
  token: string,
) => {
  console.log("🚀 ~ apiUtils.ts:44 ~ signFileService ~ userId:", userId);
  const payload = {
    data: base64Pdf,
    attached: true,
    fileNames: [fileName], // <--- Dynamic Filename
    signatureType: "PADES",
    signatureSubType: "PAdES_BASELINE_B",
    packaging: "ENVELOPED",
    signAlgorithm: "SHA256withRSA",
    hashAlgorithm: "SHA256",
    userId: userId,
    vSigEnabled: true,
    vSigPage: 1,
    vSigXPosition: 100,
    vSigYPosition: 100,
  };

  const response = await fetch(`${BASE_URL}/signFile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  console.log("🚀 ~ apiUtils.ts:65 ~ signFileService ~ response:", response);

  if (!response.ok) {
    throw new Error(`Signing failed: ${response.statusText}`);
  }

  return await response.json();
};

// 4. API: Verify File (NOW ACCEPTS fileName)
export const verifyFileService = async (
  signedBase64: string,
  userId: string,
  fileName: string,
  token: string,
) => {
  const payload = {
    data: signedBase64,
    localization: "en",
    fileNames: [fileName], // <--- Dynamic Filename
    userId: userId,
  };

  const response = await fetch(`${BASE_URL}/verifyFile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Verification failed: ${response.statusText}`);
  }

  return await response.json();
};

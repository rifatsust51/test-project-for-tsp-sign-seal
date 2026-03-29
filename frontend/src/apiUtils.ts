import axios from "axios";

import { jsPDF } from "jspdf";
import type { FormData } from "./PDFGenerator";

const BASE_URL = "https://192.168.0.155:8443/tspgatewayservice/gateway";

const TSP_TOKEN_URL = "https://192.168.0.155:8443/tspgateway/rest/admin/token";

const ADMIN_USER_ID = "d6adae7a-ad36-4f21-b4d7-2abbe744ce47";

let authToken: string | null = null;

async function getAuthToken() {
  if (authToken) return authToken;
  try {
    console.log("\n🔑 Fetching new TSP auth token...");

    const response = await axios.get(TSP_TOKEN_URL, {
      headers: { Accept: "application/json" },
    });

    if (response.data?.data?.token) {
      const raw: string = response.data.data.token;
      authToken = raw.replace("Bearer ", "").trim(); // store clean token
      console.log("✅ New TSP token acquired");
      return authToken;
    } else {
      throw new Error("No token returned from TSP API");
    }
  } catch (err) {
    console.error("❌ Failed to get TSP token");
    throw err;
  }
}

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
    fileNames: [fileName],
    signatureType: "PADES",
    signatureSubType: "PAdES_BASELINE_B",
    packaging: "ENVELOPED",
    signAlgorithm: "SHA256withRSA",
    hashAlgorithm: "SHA256",
    userId: userId,
    vSigEnabled: true,
    vSigPage: 1,
    vSigXPosition: 320,
    vSigYPosition: 750,
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

export const adminSignFileService = async (
  base64pdf: string,
  fileName: string,
) => {
  const payload = {
    bLevel: {
      claimedSignerRole: "Signer",
      contactInfo: "contact@example.com",
      location: "Jakarta, Indonesia",
      reason: "Document Approval",
      signatureProductionPlace: {
        city: "Jakarta",
        country: "Indonesia",
        postalCode: "12345",
        stateOrProvince: "DKI Jakarta",
        street: "Jl. Sudirman No. 1",
      },
      signerName: "John Doe",
    },
    customNotification: "",
    digitalIdentityId: "3ba2b99d-5426-4aa8-8c3e-772918653b9a",
    documents: [
      {
        data: base64pdf,
        fileName: fileName,
        vSigEnabled: true,
        vSigPage: 1,
        vSigXPosition: 197,
        vSigYPosition: 120,
      },
    ],
    filledBLevelParameters: true,
    packaging: "ENVELOPED",
    signAlgorithm: "SHA256withRSA",
    signatureSubType: "PAdES_BASELINE_B",
    signatureType: "PADES",
    tsaHashAlgorithm: "SHA256",
    userId: "d6adae7a-ad36-4f21-b4d7-2abbe744ce47",
  };

  const cleanToken = await getAuthToken();

  const response = await axios.post(`${BASE_URL}/v2/signFile`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cleanToken}`,
    },
  });

  if (!response) {
    throw new Error(`Signing failed: ${response}`);
  }

  return await response.data;
};

// 4. API: Verify File (NOW ACCEPTS fileName)
export const verifyFileService = async (
  signedBase64: string,
  fileName: string,
) => {
  const cleanToken = await getAuthToken();

  const dataString = Array.isArray(signedBase64)
    ? signedBase64[0]
    : signedBase64;

  const payload = {
    data: dataString,
    localization: "en",
    fileNames: [fileName],
    userId: ADMIN_USER_ID,
  };

  const response = await fetch(`${BASE_URL}/verifyFile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cleanToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Verification failed: ${response.statusText}`);
  }

  return await response.json();
};

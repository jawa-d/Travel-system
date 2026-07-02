import { extname } from "node:path";
import { put } from "@vercel/blob";

export type StoredPublicMotorFile = {
  key: string;
  label: string;
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
};

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_TYPES = new Set([...IMAGE_TYPES, "application/pdf"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const DOCUMENT_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ".pdf"]);
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;

function maxFileSize() {
  const configured = Number(process.env.PUBLIC_API_MAX_FILE_SIZE_MB);
  return Number.isFinite(configured) && configured > 0 ? configured * 1024 * 1024 : DEFAULT_MAX_FILE_SIZE;
}

function safeFileName(name: string) {
  const extension = extname(name).toLowerCase();
  const base = name.slice(0, Math.max(0, name.length - extension.length)).replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `${base || "file"}${extension}`;
}

export function validatePublicMotorFiles(input: {
  vehicleImages: File[];
  documents: Array<{ key: string; label: string; file: File }>;
}) {
  if (input.vehicleImages.length < 5) {
    throw new Error("At least 5 vehicle images are required.");
  }

  const requiredDocumentKeys = [
    "nationalIdFront",
    "nationalIdBack",
    "drivingLicense",
    "vehicleRegistration",
    "residenceCardFront",
    "residenceCardBack"
  ];
  const uploadedDocumentKeys = new Set(input.documents.map((document) => document.key));
  for (const key of requiredDocumentKeys) {
    if (!uploadedDocumentKeys.has(key)) {
      throw new Error("All required customer documents are required.");
    }
  }

  const limit = maxFileSize();
  input.vehicleImages.forEach((file) => validateFile(file, IMAGE_TYPES, IMAGE_EXTENSIONS, limit));
  input.documents.forEach((document) => validateFile(document.file, DOCUMENT_TYPES, DOCUMENT_EXTENSIONS, limit));
}

export async function savePublicMotorFiles(input: {
  requestNumber: string;
  vehicleImages: File[];
  documents: Array<{ key: string; label: string; file: File }>;
}) {
  const vehicleImages = await Promise.all(
    input.vehicleImages.map((file, index) => saveFile({
      file,
      requestNumber: input.requestNumber,
      folder: "vehicle-images",
      key: `vehicle-${index + 1}`,
      label: `Vehicle Image ${index + 1}`
    }))
  );
  const customerDocuments = await Promise.all(
    input.documents.map((document) => saveFile({
      file: document.file,
      requestNumber: input.requestNumber,
      folder: "customer-documents",
      key: document.key,
      label: document.label
    }))
  );

  return { vehicleImages, customerDocuments };
}

function validateFile(file: File, types: Set<string>, extensions: Set<string>, sizeLimit: number) {
  if (file.size <= 0) throw new Error(`File ${file.name} is empty.`);
  if (file.size > sizeLimit) throw new Error(`File ${file.name} exceeds the maximum allowed size.`);
  if (!types.has(file.type)) throw new Error(`File ${file.name} has an unsupported content type.`);
  if (!extensions.has(extname(file.name).toLowerCase())) throw new Error(`File ${file.name} has an unsupported extension.`);
}

async function saveFile(input: {
  file: File;
  requestNumber: string;
  folder: "vehicle-images" | "customer-documents";
  key: string;
  label: string;
}): Promise<StoredPublicMotorFile> {
  const filename = `${Date.now()}-${input.key}-${crypto.randomUUID()}-${safeFileName(input.file.name)}`;
  const pathname = `public-motor-requests/${input.requestNumber}/${input.folder}/${filename}`;
  const blob = await put(pathname, input.file, {
    access: "public",
    addRandomSuffix: false,
    contentType: input.file.type
  });

  return {
    key: input.key,
    label: input.label,
    url: blob.url,
    name: input.file.name,
    size: input.file.size,
    type: input.file.type,
    uploadedAt: new Date().toISOString()
  };
}

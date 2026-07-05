import { extname } from "node:path";
import { del, put } from "@vercel/blob";

export type StoredPublicMotorFile = {
  key: string;
  label: string;
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
};

export type PublicMotorUploadFailure = {
  key: string;
  label: string;
  name: string;
  reason: string;
};

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_TYPES = new Set([...IMAGE_TYPES, "application/pdf"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const DOCUMENT_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ".pdf"]);
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_MAX_TOTAL_PAYLOAD_SIZE = 25 * 1024 * 1024;

function maxFileSize() {
  const configured = Number(process.env.PUBLIC_API_MAX_FILE_SIZE_MB);
  return Number.isFinite(configured) && configured > 0 ? configured * 1024 * 1024 : DEFAULT_MAX_FILE_SIZE;
}

function maxTotalPayloadSize() {
  const configured = Number(process.env.PUBLIC_API_MAX_TOTAL_PAYLOAD_SIZE_MB);
  return Number.isFinite(configured) && configured > 0 ? configured * 1024 * 1024 : DEFAULT_MAX_TOTAL_PAYLOAD_SIZE;
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

  const totalSize = input.vehicleImages.reduce((sum, file) => sum + file.size, 0)
    + input.documents.reduce((sum, document) => sum + document.file.size, 0);
  if (totalSize > maxTotalPayloadSize()) {
    throw new Error(`Upload payload exceeds the maximum allowed size of ${Math.round(maxTotalPayloadSize() / (1024 * 1024))}MB.`);
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

  if (input.vehicleImages.some((file) => !(file instanceof File))) throw new Error("Vehicle images must be files.");
  if (input.documents.some((document) => !(document.file instanceof File))) throw new Error("Customer documents must be files.");
}

export async function savePublicMotorFiles(input: {
  requestNumber: string;
  vehicleImages: File[];
  documents: Array<{ key: string; label: string; file: File }>;
}) {
  const vehicleResults = await Promise.all(input.vehicleImages.map((file, index) => saveFileResult({
    file,
    requestNumber: input.requestNumber,
    folder: "vehicle-images",
    key: `vehicle-${index + 1}`,
    label: `Vehicle Image ${index + 1}`,
    types: IMAGE_TYPES,
    extensions: IMAGE_EXTENSIONS
  })));
  const documentResults = await Promise.all(input.documents.map((document) => saveFileResult({
    file: document.file,
    requestNumber: input.requestNumber,
    folder: "customer-documents",
    key: document.key,
    label: document.label,
    types: DOCUMENT_TYPES,
    extensions: DOCUMENT_EXTENSIONS
  })));

  const vehicleImages = vehicleResults.flatMap((result) => result.file ? [result.file] : []);
  const customerDocuments = documentResults.flatMap((result) => result.file ? [result.file] : []);
  const failures = [...vehicleResults, ...documentResults].flatMap((result) => result.failure ? [result.failure] : []);

  return { vehicleImages, customerDocuments, failures };
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

async function saveFileResult(input: {
  file: File;
  requestNumber: string;
  folder: "vehicle-images" | "customer-documents";
  key: string;
  label: string;
  types: Set<string>;
  extensions: Set<string>;
}): Promise<{ file?: StoredPublicMotorFile; failure?: PublicMotorUploadFailure }> {
  try {
    validateFile(input.file, input.types, input.extensions, maxFileSize());
    return { file: await saveFile(input) };
  } catch (error) {
    return {
      failure: {
        key: input.key,
        label: input.label,
        name: input.file.name,
        reason: error instanceof Error ? error.message : "Upload failed."
      }
    };
  }
}

export async function deleteMotorBlobFiles(files: unknown[]) {
  const urls = files
    .filter((file): file is { url: string } => Boolean(file && typeof file === "object" && "url" in file && typeof (file as { url?: unknown }).url === "string"))
    .map((file) => file.url);
  if (!urls.length) return;
  await Promise.allSettled(urls.map((url) => del(url)));
}

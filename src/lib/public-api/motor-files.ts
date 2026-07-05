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

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const DOCUMENT_TYPES = new Set([...IMAGE_TYPES, "application/pdf"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);
const DOCUMENT_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ".pdf"]);
const FALLBACK_FILE_TYPES = new Set(["", "application/octet-stream"]);
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

  for (const file of input.vehicleImages) {
    validateFile(file, IMAGE_TYPES, IMAGE_EXTENSIONS, maxFileSize());
  }
  for (const document of input.documents) {
    validateFile(document.file, DOCUMENT_TYPES, DOCUMENT_EXTENSIONS, maxFileSize());
  }
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

function normalizedContentType(file: File, types: Set<string>, extensions: Set<string>) {
  const extension = extname(file.name).toLowerCase();
  const reportedType = file.type.toLowerCase();

  if (types.has(reportedType)) return reportedType;
  if (!extensions.has(extension) || !FALLBACK_FILE_TYPES.has(reportedType)) return reportedType;

  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".heic") return "image/heic";
  if (extension === ".heif") return "image/heif";
  if (extension === ".pdf") return "application/pdf";

  return reportedType;
}

function validateFile(file: File, types: Set<string>, extensions: Set<string>, sizeLimit: number) {
  if (file.size <= 0) throw new Error(`File ${file.name} is empty.`);
  if (file.size > sizeLimit) throw new Error(`File ${file.name} exceeds the maximum allowed size.`);
  const extension = extname(file.name).toLowerCase();
  const contentType = normalizedContentType(file, types, extensions);
  if (!extensions.has(extension)) throw new Error(`File ${file.name} has an unsupported extension.`);
  if (!types.has(contentType)) throw new Error(`File ${file.name} has an unsupported content type.`);
  return contentType;
}

async function saveFile(input: {
  file: File;
  requestNumber: string;
  folder: "vehicle-images" | "customer-documents";
  key: string;
  label: string;
}): Promise<StoredPublicMotorFile> {
  const types = input.folder === "vehicle-images" ? IMAGE_TYPES : DOCUMENT_TYPES;
  const extensions = input.folder === "vehicle-images" ? IMAGE_EXTENSIONS : DOCUMENT_EXTENSIONS;
  const contentType = normalizedContentType(input.file, types, extensions);
  const filename = `${Date.now()}-${input.key}-${crypto.randomUUID()}-${safeFileName(input.file.name)}`;
  const pathname = `public-motor-requests/${input.requestNumber}/${input.folder}/${filename}`;
  const blob = await put(pathname, input.file, {
    access: "public",
    addRandomSuffix: false,
    contentType
  });

  return {
    key: input.key,
    label: input.label,
    url: blob.url,
    name: input.file.name,
    size: input.file.size,
    type: contentType,
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

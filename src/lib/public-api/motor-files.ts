import { extname } from "node:path";
import { del } from "@vercel/blob";

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

export type PublicMotorUploadedFile = {
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt?: string;
};

export type PublicMotorUploadedDocument = PublicMotorUploadedFile & {
  key: string;
  label?: string;
};

export const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
export const DOCUMENT_TYPES = new Set([...IMAGE_TYPES, "application/pdf"]);
export const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);
export const DOCUMENT_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ".pdf"]);
const FALLBACK_FILE_TYPES = new Set(["", "application/octet-stream"]);
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

export function maxPublicMotorFileSize() {
  const configured = Number(process.env.PUBLIC_API_MAX_FILE_SIZE_MB);
  return Number.isFinite(configured) && configured > 0 ? configured * 1024 * 1024 : DEFAULT_MAX_FILE_SIZE;
}

function safeFileName(name: string) {
  const extension = extname(name).toLowerCase();
  const base = name.slice(0, Math.max(0, name.length - extension.length)).replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `${base || "file"}${extension}`;
}

export function validatePublicMotorFiles(input: {
  vehicleImages: PublicMotorUploadedFile[];
  documents: PublicMotorUploadedDocument[];
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

  for (const file of input.vehicleImages) {
    validateUploadedFile(file, IMAGE_TYPES, IMAGE_EXTENSIONS, maxPublicMotorFileSize());
  }
  for (const document of input.documents) {
    validateUploadedFile(document, DOCUMENT_TYPES, DOCUMENT_EXTENSIONS, maxPublicMotorFileSize());
  }
}

export function buildPublicMotorFileRecords(input: {
  vehicleImages: PublicMotorUploadedFile[];
  documents: PublicMotorUploadedDocument[];
}) {
  validatePublicMotorFiles(input);
  const uploadedAt = new Date().toISOString();

  return {
    vehicleImages: input.vehicleImages.map((file, index) => storedFile({
      ...file,
      key: `vehicle-${index + 1}`,
      label: `Vehicle Image ${index + 1}`,
      types: IMAGE_TYPES,
      extensions: IMAGE_EXTENSIONS,
      uploadedAt
    })),
    customerDocuments: input.documents.map((document) => storedFile({
      ...document,
      label: document.label ?? document.key,
      types: DOCUMENT_TYPES,
      extensions: DOCUMENT_EXTENSIONS,
      uploadedAt
    }))
  };
}

export function safePublicMotorFileName(name: string) {
  return safeFileName(name);
}

export function normalizedPublicMotorContentType(file: Pick<PublicMotorUploadedFile, "name" | "type">, types: Set<string>, extensions: Set<string>) {
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

export function validateUploadedFile(file: PublicMotorUploadedFile, types: Set<string>, extensions: Set<string>, sizeLimit: number) {
  if (!file.url || !/^https:\/\//i.test(file.url)) throw new Error(`File ${file.name || "upload"} has an invalid Blob URL.`);
  if (file.size <= 0) throw new Error(`File ${file.name} is empty.`);
  if (file.size > sizeLimit) throw new Error(`File ${file.name} exceeds the maximum allowed size.`);
  const extension = extname(file.name).toLowerCase();
  const contentType = normalizedPublicMotorContentType(file, types, extensions);
  if (!extensions.has(extension)) throw new Error(`File ${file.name} has an unsupported extension.`);
  if (!types.has(contentType)) throw new Error(`File ${file.name} has an unsupported content type.`);
  return contentType;
}

function storedFile(input: PublicMotorUploadedFile & {
  key: string;
  label: string;
  types: Set<string>;
  extensions: Set<string>;
  uploadedAt: string;
}): StoredPublicMotorFile {
  const contentType = validateUploadedFile(input, input.types, input.extensions, maxPublicMotorFileSize());

  return {
    key: input.key,
    label: input.label,
    url: input.url,
    name: input.name,
    size: input.size,
    type: contentType,
    uploadedAt: input.uploadedAt
  };
}

export async function deleteMotorBlobFiles(files: unknown[]) {
  const urls = files
    .filter((file): file is { url: string } => Boolean(file && typeof file === "object" && "url" in file && typeof (file as { url?: unknown }).url === "string"))
    .map((file) => file.url);
  if (!urls.length) return;
  await Promise.allSettled(urls.map((url) => del(url)));
}

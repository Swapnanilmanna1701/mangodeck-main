import fs from "fs";
import mammoth from "mammoth";
import path from "path";
import { promisify } from "util";

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

export async function processFile(
  filePath: string,
  mimeType: string
): Promise<string> {
  try {
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    const fileExtension = path.extname(filePath).toLowerCase();
    let text = "";

    switch (fileExtension) {
      case ".txt":
        text = await readFile(filePath, "utf-8");
        break;

      case ".pdf":
        try {
          const pdfBuffer = await readFile(filePath);
          const pdfParse = await import("pdf-parse");
          const data = await pdfParse.default(pdfBuffer);
          text = data.text;
        } catch (pdfError: any) {
          throw new Error(`PDF processing failed: ${pdfError.message}`);
        }
        break;

      case ".docx":
        try {
          const result = await mammoth.extractRawText({ path: filePath });
          if (result.messages.length > 0) {
            console.warn("Mammoth messages:", result.messages);
          }
          text = result.value;
        } catch (docxError: any) {
          throw new Error(`DOCX processing failed: ${docxError.message}`);
        }
        break;

      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    // Validate extracted text
    if (!text || text.trim().length === 0) {
      throw new Error("No text content extracted from file");
    }

    return text.trim();
  } catch (error: any) {
    throw new Error(`File processing failed: ${error.message}`);
  } finally {
    // Clean up uploaded file
    try {
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (cleanupError) {
      console.error("Failed to clean up uploaded file:", cleanupError);
    }
  }
}

// Utility function to check if file is supported
export function isSupportedFileType(filename: string): boolean {
  const supportedExtensions = [".txt", ".pdf", ".docx"];
  const extension = path.extname(filename).toLowerCase();
  return supportedExtensions.includes(extension);
}

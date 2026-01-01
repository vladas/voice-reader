// FileSystem abstraction for testability
export interface IFileSystem {
  readBytes(uri: string): Promise<Uint8Array>;
  writeBase64(uri: string, base64Data: string): Promise<void>;
  copyFile(sourceUri: string, destUri: string): Promise<void>;
  directoryExists(path: string): boolean;
  createDirectory(path: string): void;
  deleteDirectory(path: string): void;
  getDocumentPath(): string;
  joinPath(...parts: string[]): string;
}

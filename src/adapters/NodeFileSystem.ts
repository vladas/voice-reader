// Node.js implementation for testing
import * as fs from 'fs';
import * as path from 'path';
import { IFileSystem } from './IFileSystem';

export class NodeFileSystem implements IFileSystem {
  private basePath: string;

  constructor(basePath: string = '/tmp/voicereader-test') {
    this.basePath = basePath;
  }

  async readBytes(uri: string): Promise<Uint8Array> {
    // Handle file:// URIs
    const filePath = uri.replace('file://', '');
    return new Uint8Array(fs.readFileSync(filePath));
  }

  async writeBase64(uri: string, base64Data: string): Promise<void> {
    const filePath = uri.replace('file://', '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
  }

  async copyFile(sourceUri: string, destUri: string): Promise<void> {
    const sourcePath = sourceUri.replace('file://', '');
    const destPath = destUri.replace('file://', '');
    fs.copyFileSync(sourcePath, destPath);
  }

  directoryExists(dirPath: string): boolean {
    const resolvedPath = dirPath.replace('file://', '');
    return fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory();
  }

  createDirectory(dirPath: string): void {
    const resolvedPath = dirPath.replace('file://', '');
    fs.mkdirSync(resolvedPath, { recursive: true });
  }

  deleteDirectory(dirPath: string): void {
    const resolvedPath = dirPath.replace('file://', '');
    if (fs.existsSync(resolvedPath)) {
      fs.rmSync(resolvedPath, { recursive: true, force: true });
    }
  }

  getDocumentPath(): string {
    return `file://${this.basePath}`;
  }

  joinPath(...parts: string[]): string {
    return parts.join('/').replace(/\/+/g, '/');
  }
}

// Production implementation using expo-file-system
import { File, Directory, Paths } from 'expo-file-system';
import { writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { IFileSystem } from './IFileSystem';

export class ExpoFileSystem implements IFileSystem {
  async readBytes(uri: string): Promise<Uint8Array> {
    const file = new File(uri);
    return await file.bytes();
  }

  async writeBase64(uri: string, base64Data: string): Promise<void> {
    await writeAsStringAsync(uri, base64Data, {
      encoding: EncodingType.Base64
    });
  }

  async copyFile(sourceUri: string, destUri: string): Promise<void> {
    const sourceFile = new File(sourceUri);
    const destFile = new File(destUri);
    sourceFile.copy(destFile);
  }

  directoryExists(path: string): boolean {
    const dir = new Directory(path);
    return dir.exists;
  }

  createDirectory(path: string): void {
    const dir = new Directory(path);
    dir.create();
  }

  deleteDirectory(path: string): void {
    const dir = new Directory(path);
    if (dir.exists) {
      dir.delete();
    }
  }

  getDocumentPath(): string {
    return Paths.document.uri;
  }

  joinPath(...parts: string[]): string {
    // Simple path join - expo-file-system uses URI format
    return parts.join('/').replace(/\/+/g, '/');
  }
}

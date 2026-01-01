import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { IFileSystem } from '../adapters/IFileSystem';
import { ExpoFileSystem } from '../adapters/ExpoFileSystem';

interface FileSystemContextValue {
  fileSystem: IFileSystem;
}

const FileSystemContext = createContext<FileSystemContextValue | null>(null);

interface FileSystemProviderProps {
  children: ReactNode;
  fileSystem?: IFileSystem; // Allow injecting a custom implementation (for testing)
}

export const FileSystemProvider = ({ 
  children, 
  fileSystem 
}: FileSystemProviderProps) => {
  const value = useMemo(() => ({
    fileSystem: fileSystem ?? new ExpoFileSystem()
  }), [fileSystem]);

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = (): IFileSystem => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context.fileSystem;
};

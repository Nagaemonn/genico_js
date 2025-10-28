import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script for secure communication between main and renderer processes
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFile: () => ipcRenderer.invoke('select-file'),
  convertToIco: (filePath: string) => ipcRenderer.invoke('convert-to-ico', filePath),
  saveFile: (defaultName: string) => ipcRenderer.invoke('save-file', defaultName),
  writeFile: (filePath: string, data: Buffer) => ipcRenderer.invoke('write-file', filePath, data),
  
  // Event listeners
  onFileSelected: (callback: (filePath: string) => void) => {
    ipcRenderer.on('file-selected', (event, filePath) => callback(filePath));
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      selectFile: () => Promise<string | null>;
      convertToIco: (filePath: string) => Promise<Buffer>;
      saveFile: (defaultName: string) => Promise<string | null>;
      writeFile: (filePath: string, data: Buffer) => Promise<boolean>;
      onFileSelected: (callback: (filePath: string) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

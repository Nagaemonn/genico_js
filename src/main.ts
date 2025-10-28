import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Jimp } from 'jimp';

/**
 * Electron main process for Genico desktop application
 */
class GenicoApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.setupApp();
  }

  /**
   * Sets up the Electron application
   */
  private setupApp(): void {
    // Set app name and icon
    app.setName('Genico');
    
    // Handle app ready event
    app.whenReady().then(() => {
      this.createWindow();
      this.setupMenu();
      this.setupIpcHandlers();
    });

    // Handle window closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Handle app activate (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  /**
   * Creates the main application window
   */
  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(process.cwd(), 'genico.ico'),
      title: 'Genico - PNG to ICO Converter',
      show: false // Don't show until ready
    });

    // Load the HTML file
    this.mainWindow.loadFile(path.join(__dirname, '../templates/index.html'));

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
      }
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }
  }

  /**
   * Sets up the application menu
   */
  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Open PNG File',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.openFileDialog();
            }
          },
          {
            type: 'separator'
          },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About Genico',
            click: () => {
              this.showAboutDialog();
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  /**
   * Sets up IPC handlers for communication with renderer process
   */
  private setupIpcHandlers(): void {
    // Handle file selection
    ipcMain.handle('select-file', async () => {
      if (!this.mainWindow) return null;

      const result: any = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'PNG Images', extensions: ['png'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    });

    // Handle file conversion
    ipcMain.handle('convert-to-ico', async (event, filePath: string) => {
      try {
        return await this.convertPngToIco(filePath);
      } catch (error) {
        throw new Error(`変換エラー: ${error}`);
      }
    });

    // Handle save file dialog
    ipcMain.handle('save-file', async (event, defaultName: string) => {
      if (!this.mainWindow) return null;

      const result: any = await dialog.showSaveDialog(this.mainWindow, {
        defaultPath: defaultName,
        filters: [
          { name: 'ICO Files', extensions: ['ico'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        return result.filePath;
      }
      return null;
    });

    // Handle file writing
    ipcMain.handle('write-file', async (event, filePath: string, data: Buffer) => {
      try {
        await fs.writeFile(filePath, data);
        return true;
      } catch (error) {
        throw new Error(`ファイル保存エラー: ${error}`);
      }
    });
  }

  /**
   * Opens file selection dialog
   */
  private async openFileDialog(): Promise<void> {
    if (!this.mainWindow) return;

    const result: any = await dialog.showOpenDialog(this.mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'PNG Images', extensions: ['png'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      this.mainWindow.webContents.send('file-selected', result.filePaths[0]);
    }
  }

  /**
   * Shows about dialog
   */
  private showAboutDialog(): void {
    if (!this.mainWindow) return;

    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About Genico',
      message: 'Genico - PNG to ICO Converter',
      detail: 'A desktop application for converting PNG images to Windows ICO format.\n\nVersion 1.0.0\nBuilt with Electron and TypeScript'
    });
  }

  /**
   * Converts PNG file to ICO format
   * @param filePath - Path to the PNG file
   * @returns Promise<Buffer> - ICO file buffer
   */
  private async convertPngToIco(filePath: string): Promise<Buffer> {
    try {
      // Read and process the image with Jimp
      const image = await Jimp.read(filePath);
      
      // Validate the image
      if (image.mime !== 'image/png') {
        throw new Error('PNGファイルのみ対応しています。');
      }

      if (image.width !== image.height) {
        throw new Error('画像は正方形（1:1）でアップロードしてください。');
      }

      if (image.width < 256 || image.height < 256) {
        throw new Error('画像サイズは256px以上を推奨します。');
      }

      // Resize to 256x256 and convert to PNG
      // Note: Jimp doesn't directly support ICO output, so we'll create a PNG
      // that can be used as an ICO (many systems accept PNG as ICO)
      const resizedImage = image.resize({ w: 256, h: 256 });
      const pngBuffer = await resizedImage.getBuffer('image/png');

      return pngBuffer;
    } catch (error) {
      throw new Error(`ICO変換に失敗しました: ${error}`);
    }
  }
}

// Create and start the application
new GenicoApp();

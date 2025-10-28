/**
 * Renderer process JavaScript for Genico Electron app
 */
class GenicoRenderer {
  constructor() {
    this.selectedFilePath = null;
    this.initializeEventListeners();
    this.setupElectronListeners();
  }

  /**
   * Initialize DOM event listeners
   */
  initializeEventListeners() {
    const selectFileBtn = document.getElementById('select-file-btn');
    const convertBtn = document.getElementById('convert-btn');

    if (selectFileBtn) {
      selectFileBtn.addEventListener('click', () => this.selectFile());
    }

    if (convertBtn) {
      convertBtn.addEventListener('click', () => this.convertFile());
    }
  }

  /**
   * Setup Electron-specific event listeners
   */
  setupElectronListeners() {
    // Listen for file selection from main process
    if (window.electronAPI) {
      window.electronAPI.onFileSelected((filePath) => {
        this.handleFileSelected(filePath);
      });
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `status ${type}`;
      statusElement.style.display = 'block';
    }
  }

  /**
   * Hide status message
   */
  hideStatus() {
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.style.display = 'none';
    }
  }

  /**
   * Select file using Electron's native dialog
   */
  async selectFile() {
    try {
      this.hideStatus();
      
      if (!window.electronAPI) {
        this.showStatus('Electron API not available', 'error');
        return;
      }

      const filePath = await window.electronAPI.selectFile();
      
      if (filePath) {
        this.handleFileSelected(filePath);
      }
    } catch (error) {
      this.showStatus(`ファイル選択エラー: ${error}`, 'error');
    }
  }

  /**
   * Handle file selection
   */
  handleFileSelected(filePath) {
    this.selectedFilePath = filePath;
    
    // Extract filename from path
    const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown file';
    
    // Update UI
    const fileNameElement = document.getElementById('file-name');
    const selectedFileElement = document.getElementById('selected-file');
    const convertBtnElement = document.getElementById('convert-btn');
    
    if (fileNameElement) {
      fileNameElement.textContent = fileName;
    }
    
    if (selectedFileElement) {
      selectedFileElement.style.display = 'block';
    }
    
    if (convertBtnElement) {
      convertBtnElement.style.display = 'inline-block';
    }

    this.showStatus('ファイルが選択されました', 'success');
  }

  /**
   * Convert selected file to ICO
   */
  async convertFile() {
    if (!this.selectedFilePath) {
      this.showStatus('ファイルが選択されていません', 'error');
      return;
    }

    if (!window.electronAPI) {
      this.showStatus('Electron API not available', 'error');
      return;
    }

    try {
      this.showStatus('変換中...', 'info');
      
      // Disable convert button during conversion
      const convertBtn = document.getElementById('convert-btn');
      if (convertBtn) {
        convertBtn.disabled = true;
        convertBtn.textContent = '🔄 変換中...';
      }

      // Convert file
      const icoData = await window.electronAPI.convertToIco(this.selectedFilePath);
      
      // Generate default filename
      const fileName = this.selectedFilePath.split('/').pop() || this.selectedFilePath.split('\\').pop() || 'converted';
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      const defaultIcoName = `${baseName}.ico`;

      // Show save dialog
      const savePath = await window.electronAPI.saveFile(defaultIcoName);
      
      if (savePath) {
        // Save the file
        await window.electronAPI.writeFile(savePath, icoData);
        this.showStatus('ICOファイルが保存されました！', 'success');
      } else {
        this.showStatus('保存がキャンセルされました', 'info');
      }

    } catch (error) {
      this.showStatus(`変換エラー: ${error}`, 'error');
    } finally {
      // Re-enable convert button
      const convertBtn = document.getElementById('convert-btn');
      if (convertBtn) {
        convertBtn.disabled = false;
        convertBtn.textContent = '🔄 ICOに変換';
      }
    }
  }
}

// Initialize the renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GenicoRenderer();
});

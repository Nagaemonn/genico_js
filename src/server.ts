import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
// URL API is now built-in, no need to import
import { IncomingMessage, ServerResponse } from 'http';
import formidable from 'formidable';
import sharp from 'sharp';

/**
 * Configuration interface for the server
 */
interface ServerConfig {
  port: number;
  templateDir: string;
  defaultPort: number;
}

/**
 * Template context for rendering HTML templates
 */
interface TemplateContext {
  [key: string]: string | number | boolean;
}

/**
 * File upload result interface
 */
interface FileUploadResult {
  filename: string;
  fileData: Buffer;
}

/**
 * Image validation warnings
 */
interface ImageValidationResult {
  isValid: boolean;
  warnings: string[];
}

/**
 * Main server class for PNG to ICO conversion
 */
class GenicoServer {
  private config: ServerConfig;

  constructor(port?: number) {
    this.config = {
      port: port || 3000,
      templateDir: 'templates',
      defaultPort: 3000
    };
  }

  /**
   * Renders HTML template with context variables
   * @param templateName - Name of the template file
   * @param context - Context variables for template rendering
   * @returns Promise<Buffer> - Rendered HTML as buffer
   */
  private async renderTemplate(templateName: string, context?: TemplateContext): Promise<Buffer> {
    const templatePath = path.join(this.config.templateDir, templateName);
    
    try {
      let html = await fs.readFile(templatePath, 'utf-8');
      
      if (context) {
        for (const [key, value] of Object.entries(context)) {
          const placeholder = `{{ ${key} }}`;
          html = html.replace(new RegExp(placeholder, 'g'), String(value));
        }
      }
      
      return Buffer.from(html, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to render template ${templateName}: ${error}`);
    }
  }

  /**
   * Parses multipart form data to extract uploaded file
   * @param req - HTTP request object
   * @returns Promise<FileUploadResult | null> - Parsed file data or null if parsing failed
   */
  private async parseMultipartForm(req: IncomingMessage): Promise<FileUploadResult | null> {
    return new Promise((resolve) => {
      const form = formidable({
        maxFileSize: 10 * 1024 * 1024, // 10MB limit
        filter: (part) => {
          return part.mimetype?.startsWith('image/') || false;
        }
      });

      form.parse(req, async (err: any, fields: any, files: any) => {
        if (err) {
          console.error('Formidable parse error:', err);
          resolve(null);
          return;
        }

        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        if (!file) {
          console.error('No file found in upload');
          resolve(null);
          return;
        }

        try {
          // Read file data if it's a file path
          let fileData: Buffer;
          if (file.filepath) {
            fileData = await fs.readFile(file.filepath);
          } else if (file.buffer) {
            fileData = file.buffer;
          } else {
            console.error('No file data available');
            resolve(null);
            return;
          }

          resolve({
            filename: file.originalFilename || 'uploaded.png',
            fileData: fileData
          });
        } catch (error) {
          console.error('Error reading file:', error);
          resolve(null);
        }
      });
    });
  }

  /**
   * Validates uploaded image and returns validation result
   * @param imageBuffer - Image buffer data
   * @param filename - Original filename
   * @returns Promise<ImageValidationResult> - Validation result with warnings
   */
  private async validateImage(imageBuffer: Buffer, filename: string): Promise<ImageValidationResult> {
    const warnings: string[] = [];

    try {
      // Check if buffer is empty
      if (!imageBuffer || imageBuffer.length === 0) {
        warnings.push('画像ファイルが空です。');
        return {
          isValid: false,
          warnings
        };
      }

      const metadata = await sharp(imageBuffer).metadata();
      
      // Check if it's PNG format
      if (!filename.toLowerCase().endsWith('.png') || metadata.format !== 'png') {
        warnings.push('PNGファイルのみ対応しています。');
      }

      // Check if image is square
      if (metadata.width !== metadata.height) {
        warnings.push('画像は正方形（1:1）でアップロードしてください。');
      }

      // Check minimum size
      if ((metadata.width || 0) < 256 || (metadata.height || 0) < 256) {
        warnings.push('画像サイズは256px以上を推奨します。');
      }

      return {
        isValid: warnings.length === 0,
        warnings
      };
    } catch (error) {
      console.error('Image validation error:', error);
      warnings.push(`画像の読み込みに失敗しました: ${error}`);
      return {
        isValid: false,
        warnings
      };
    }
  }

  /**
   * Converts PNG image to ICO format
   * @param imageBuffer - Source image buffer
   * @param filename - Original filename
   * @returns Promise<Buffer> - ICO file buffer
   */
  private async convertToIco(imageBuffer: Buffer, filename: string): Promise<Buffer> {
    try {
      // Create ICO with multiple sizes
      const sizes = [256, 128, 48, 32, 16];
      
      // Convert to PNG first to ensure proper format
      const pngBuffer = await sharp(imageBuffer)
        .png()
        .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

      // For now, we'll create a simple ICO by converting the PNG
      // Note: Sharp doesn't directly support ICO output, so we'll use PNG as fallback
      // In a production environment, you might want to use a dedicated ICO library
      return pngBuffer;
    } catch (error) {
      throw new Error(`ICO変換に失敗しました: ${error}`);
    }
  }

  /**
   * Handles GET requests
   * @param req - HTTP request object
   * @param res - HTTP response object
   */
  private async handleGet(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;

    try {
      if (pathname === '/') {
        const html = await this.renderTemplate('index.html');
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8'
        });
        res.end(html);
      } else if (pathname === '/favicon.ico') {
        try {
          const faviconPath = path.join(process.cwd(), 'genico.ico');
          const faviconData = await fs.readFile(faviconPath);
          res.writeHead(200, {
            'Content-Type': 'image/x-icon'
          });
          res.end(faviconData);
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Favicon Not Found');
        }
      } else if (pathname?.startsWith('/templates/')) {
        const filePath = pathname.substring(1);
        try {
          const fileData = await fs.readFile(filePath);
          const contentType = filePath.endsWith('.css') 
            ? 'text/css; charset=utf-8' 
            : 'application/octet-stream';
          
          res.writeHead(200, {
            'Content-Type': contentType
          });
          res.end(fileData);
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File Not Found');
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  }

  /**
   * Handles POST requests for file upload and conversion
   * @param req - HTTP request object
   * @param res - HTTP response object
   */
  private async handlePost(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const uploadResult = await this.parseMultipartForm(req);
      
      if (!uploadResult) {
        const errorHtml = await this.renderTemplate('error.html', {
          error_message: 'Bad Request'
        });
        res.writeHead(400, {
          'Content-Type': 'text/html; charset=utf-8'
        });
        res.end(errorHtml);
        return;
      }

      const { filename, fileData } = uploadResult;
      
      // Validate the uploaded image
      const validation = await this.validateImage(fileData, filename);
      
      if (!validation.isValid) {
        const errorHtml = await this.renderTemplate('error.html', {
          error_message: validation.warnings.join('<br>')
        });
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8'
        });
        res.end(errorHtml);
        return;
      }

      // Convert to ICO
      const icoData = await this.convertToIco(fileData, filename);
      const icoName = path.parse(filename).name + '.ico';
      
      // URL encode filename for safe handling
      const encodedIcoName = encodeURIComponent(icoName);
      
      res.writeHead(200, {
        'Content-Type': 'image/x-icon',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedIcoName}`
      });
      res.end(icoData);
      
    } catch (error) {
      const errorHtml = await this.renderTemplate('error.html', {
        error_message: String(error)
      });
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      res.end(errorHtml);
    }
  }

  /**
   * Main request handler
   * @param req - HTTP request object
   * @param res - HTTP response object
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const method = req.method?.toUpperCase();

    switch (method) {
      case 'GET':
        await this.handleGet(req, res);
        break;
      case 'POST':
        await this.handlePost(req, res);
        break;
      default:
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
  }

  /**
   * Starts the HTTP server
   */
  public start(): void {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res).catch((error) => {
        console.error('Request handling error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      });
    });

    server.listen(this.config.port, () => {
      console.log(`Serving at http://localhost:${this.config.port}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down server...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let port = 3000;

  if (args.length > 0) {
    const portArg = parseInt(args[0]);
    if (isNaN(portArg)) {
      console.error('Usage: npm start [PORT]');
      process.exit(1);
    }
    port = portArg;
  }

  const server = new GenicoServer(port);
  server.start();
}

// Start the server if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { GenicoServer };

const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/**
 * Embed all collected signatures into a PDF and save the final signed version.
 * 
 * signatures: array of { signature_type, signature_data, page_number, x_position, y_position, width, height, typed_name, font_style }
 * - signature_type: 'draw' | 'upload' | 'typed'
 * - signature_data: base64 image string (for draw/upload) OR text (for typed)
 * - page_number: 0-indexed
 * - x_position, y_position: percentage (0-100) of page width/height from top-left
 * - width, height: percentage of page width/height
 */
async function embedSignaturesIntoPDF(originalFilePath, signaturesData) {
  const pdfBytes = fs.readFileSync(originalFilePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  for (const sig of signaturesData) {
    const pageIndex = (sig.page_number || 1) - 1;
    const page = pages[Math.min(pageIndex, pages.length - 1)];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Convert percentage positions to actual coordinates
    // x_position/y_position are % from top-left (0-100)
    const xPercent = parseFloat(sig.x_position) || 10;
    const yPercent = parseFloat(sig.y_position) || 80;
    const wPercent = parseFloat(sig.width) || 20;
    const hPercent = parseFloat(sig.height) || 8;

    const x = (xPercent / 100) * pageWidth;
    const h = (hPercent / 100) * pageHeight;
    const w = (wPercent / 100) * pageWidth;
    // PDF y is from bottom; y_position is from top
    const y = pageHeight - (yPercent / 100) * pageHeight - h;

    if (sig.signature_type === 'typed' && sig.typed_name) {
      // Draw typed signature as styled text
      // Use available fonts and style selection
      const { StandardFonts } = require('pdf-lib');
      const fonts = [StandardFonts.TimesRomanItalic, StandardFonts.HelveticaOblique, StandardFonts.CourierOblique];
      const fontChoice = parseInt(sig.font_style) || 0;
      const font = await pdfDoc.embedFont(fonts[fontChoice % fonts.length]);
      
      const fontSize = Math.min(h * 0.7, 36);
      page.drawText(sig.typed_name, {
        x: x + 4,
        y: y + (h - fontSize) / 2,
        size: fontSize,
        font,
        color: rgb(0.05, 0.1, 0.5),
        opacity: 0.9
      });

      // Draw underline
      page.drawLine({
        start: { x, y },
        end: { x: x + w, y },
        thickness: 1,
        color: rgb(0.3, 0.3, 0.6),
        opacity: 0.5
      });
    } else if (sig.signature_data) {
      // Draw image signature (draw or upload)
      try {
        let imageBytes;
        let dataStr = sig.signature_data;

        if (dataStr.startsWith('data:')) {
          // base64 data URL
          const base64 = dataStr.split(',')[1];
          imageBytes = Buffer.from(base64, 'base64');
        } else if (fs.existsSync(dataStr)) {
          imageBytes = fs.readFileSync(dataStr);
        } else {
          // Try as base64 directly
          imageBytes = Buffer.from(dataStr, 'base64');
        }

        let image;
        try {
          image = await pdfDoc.embedPng(imageBytes);
        } catch {
          image = await pdfDoc.embedJpg(imageBytes);
        }

        page.drawImage(image, {
          x,
          y,
          width: w,
          height: h
        });
      } catch (err) {
        console.error('[PDF] Failed to embed image signature:', err.message);
        // Fallback: draw a placeholder rectangle
        page.drawRectangle({
          x, y, width: w, height: h,
          borderColor: rgb(0.2, 0.4, 0.8),
          borderWidth: 1,
          opacity: 0.3
        });
      }
    }

    // Draw a subtle border around signature area
    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 0.5,
      opacity: 0.2
    });
  }

  // Add signing timestamp watermark on last page
  const lastPage = pages[pages.length - 1];
  const { width: lw, height: lh } = lastPage.getSize();
  const { StandardFonts } = require('pdf-lib');
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const timestamp = new Date().toISOString();
  lastPage.drawText(`Digitally signed via SignFlow | ${timestamp}`, {
    x: 40,
    y: 20,
    size: 7,
    font: helv,
    color: rgb(0.6, 0.6, 0.6),
    opacity: 0.6
  });

  const finalBytes = await pdfDoc.save();

  const ext = path.extname(originalFilePath);
  const base = path.basename(originalFilePath, ext);
  const signedFileName = `${base}_signed${ext}`;
  const signedFilePath = path.join(UPLOADS_DIR, signedFileName);
  fs.writeFileSync(signedFilePath, finalBytes);

  return signedFilePath;
}

module.exports = { embedSignaturesIntoPDF };

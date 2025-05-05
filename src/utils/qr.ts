import QRCode from "qrcode";

export async function generateQR(content: string): Promise<string> {
  return QRCode.toString(content, { 
    type: 'svg',
    margin: 2,
    width: 200,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}
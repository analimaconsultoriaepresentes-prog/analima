import jsPDF from "jspdf";
import { Product } from "@/hooks/useProducts";

export interface LabelItem {
  product: Product;
  quantity: number;
  isPromotion: boolean;
}

interface LabelOptions {
  labelColor?: string;
}

// A4 dimensions in mm
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

// Label dimensions in mm
const LABEL_WIDTH = 47;
const LABEL_HEIGHT = 23;

// Grid: 4 columns x 12 rows = 48 labels per page
const COLS = 4;
const ROWS = 12;
const LABELS_PER_PAGE = COLS * ROWS; // 48

// Calculate margins to center the grid on A4
const TOTAL_LABELS_WIDTH = COLS * LABEL_WIDTH; // 188mm
const TOTAL_LABELS_HEIGHT = ROWS * LABEL_HEIGHT; // 276mm
const MARGIN_LEFT = (A4_WIDTH - TOTAL_LABELS_WIDTH) / 2; // ~11mm
const MARGIN_TOP = (A4_HEIGHT - TOTAL_LABELS_HEIGHT) / 2; // ~10.5mm

// Default colors
const DEFAULT_PRIMARY_COLOR: [number, number, number] = [147, 51, 234]; // Purple #9333EA
const SUCCESS_COLOR: [number, number, number] = [34, 139, 34]; // Green for PIX
const PROMOTION_PRIMARY_COLOR: [number, number, number] = [249, 115, 22]; // Orange #F97316
const PROMOTION_ACCENT_COLOR: [number, number, number] = [239, 68, 68]; // Red #EF4444

// Helper to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ];
  }
  return DEFAULT_PRIMARY_COLOR;
}

// Helper to create accent color (lighter version)
function createAccentColor(rgb: [number, number, number]): [number, number, number] {
  return [
    Math.min(255, rgb[0] + 40),
    Math.min(255, rgb[1] + 20),
    Math.min(255, rgb[2] + 30)
  ];
}

// Helper to check if product is on promotion (PIX < Card)
function isOnPromotion(product: Product): boolean {
  return product.pricePix < product.priceCard;
}

// Helper to extract volume from product name (e.g., "Perfume XYZ 75ml" -> "75ML")
function extractVolume(name: string): string | null {
  const match = name.match(/(\d+)\s*(ml|ML|g|G|kg|KG)/i);
  if (match) {
    return `${match[1]}${match[2].toUpperCase()}`;
  }
  return null;
}

// Helper to format product name (remove volume if present, no truncation)
function formatProductName(name: string): string {
  // Remove volume from name to avoid duplication
  let cleanName = name.replace(/\s*\d+\s*(ml|ML|g|G|kg|KG)/i, "").trim();
  return cleanName.toUpperCase();
}

// Helper to split text into lines that fit within a given width
function splitTextIntoLines(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number = 2
): string[] {
  doc.setFontSize(fontSize);
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        if (lines.length >= maxLines) break;
      }
      currentLine = word;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

// Format price
function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

// Draw a single label at position (x, y)
function drawLabel(
  doc: jsPDF,
  x: number,
  y: number,
  product: Product,
  primaryColor: [number, number, number],
  accentColor: [number, number, number],
  isPromo: boolean
) {
  const volume = extractVolume(product.name);
  const productName = formatProductName(product.name);
  
  // Use promotion colors if product is on sale
  const labelPrimaryColor = isPromo ? PROMOTION_PRIMARY_COLOR : primaryColor;
  const labelAccentColor = isPromo ? PROMOTION_ACCENT_COLOR : accentColor;
  
  // Top colored band (approximately 60% of height)
  const topHeight = LABEL_HEIGHT * 0.58;
  const bottomHeight = LABEL_HEIGHT - topHeight;

  // Draw gradient-like top band (solid color in PDF)
  doc.setFillColor(...labelPrimaryColor);
  doc.rect(x, y, LABEL_WIDTH, topHeight, "F");

  // Add slight gradient effect with overlay
  doc.setFillColor(...labelAccentColor);
  doc.setGState(doc.GState({ opacity: 0.3 }));
  doc.rect(x + LABEL_WIDTH * 0.5, y, LABEL_WIDTH * 0.5, topHeight, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  // Draw "OFERTA" badge for promotion products
  if (isPromo) {
    // White badge background
    doc.setFillColor(255, 255, 255);
    const badgeWidth = 14;
    const badgeHeight = 4;
    const badgeX = x + LABEL_WIDTH - badgeWidth - 1.5;
    const badgeY = y + 1;
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 0.5, 0.5, "F");
    
    // "OFERTA" text
    doc.setTextColor(...PROMOTION_PRIMARY_COLOR);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(3.5);
    doc.text("OFERTA", badgeX + badgeWidth / 2, badgeY + 2.8, { align: "center" });
  }

  // Product name (white, bold, up to 2 lines)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  
  // Calculate available width for text (with padding and space for badge/volume)
  const textPadding = 2;
  const rightSpace = isPromo ? 16 : (volume ? 12 : 0);
  const availableWidth = LABEL_WIDTH - (textPadding * 2) - rightSpace;
  
  // Split text into max 2 lines
  const fontSize = 6.5;
  const lines = splitTextIntoLines(doc, productName, availableWidth, fontSize, 2);
  
  // Calculate vertical positioning to center text in the colored band
  const lineHeight = fontSize * 0.4; // Approximate line height in mm
  const totalTextHeight = lines.length * lineHeight;
  const startY = y + (topHeight / 2) - (totalTextHeight / 2) + lineHeight;
  
  // Draw each line centered vertically
  doc.setFontSize(fontSize);
  lines.forEach((line, index) => {
    const lineY = startY + (index * lineHeight);
    doc.text(line, x + textPadding, lineY);
  });
  
  // Volume badge on the right (if present and not promotion)
  if (volume && !isPromo) {
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    const volumeY = y + topHeight / 2 + 1;
    doc.text(volume, x + LABEL_WIDTH - textPadding, volumeY, { align: "right" });
  }

  // Bottom white area
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y + topHeight, LABEL_WIDTH, bottomHeight, "F");

  // Divider line
  const dividerX = x + LABEL_WIDTH / 2;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(dividerX, y + topHeight + 2, dividerX, y + LABEL_HEIGHT - 2);

  // Card price (left side)
  const leftCenterX = x + LABEL_WIDTH / 4;
  const bottomCenterY = y + topHeight + bottomHeight / 2;

  // Label "CARTÃO" - increased size
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.text("CARTÃO", leftCenterX, bottomCenterY - 2.5, { align: "center" });

  // Card price value - significantly increased
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(formatPrice(product.priceCard), leftCenterX, bottomCenterY + 2.5, { align: "center" });

  // PIX/OFERTA price (right side) - with more emphasis
  const rightCenterX = x + (LABEL_WIDTH * 3) / 4;

  // Label - use "OFERTA" for promotions, "PIX" for regular
  const priceLabel = isPromo ? "OFERTA" : "PIX";
  const priceLabelColor: [number, number, number] = isPromo ? PROMOTION_PRIMARY_COLOR : SUCCESS_COLOR;
  
  doc.setTextColor(...priceLabelColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.text(priceLabel, rightCenterX, bottomCenterY - 2.5, { align: "center" });

  // PIX price value - significantly increased, most prominent
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(formatPrice(product.pricePix), rightCenterX, bottomCenterY + 2.5, { align: "center" });

  // Optional: thin border around label (helps with cutting)
  doc.setDrawColor(isPromo ? 249 : 200, isPromo ? 115 : 200, isPromo ? 22 : 200);
  doc.setLineWidth(0.1);
  doc.rect(x, y, LABEL_WIDTH, LABEL_HEIGHT);
}

export async function generateLabelsPDF(
  items: LabelItem[],
  action: "download" | "print",
  options?: LabelOptions
): Promise<void> {
  // Get colors
  const primaryColor = options?.labelColor ? hexToRgb(options.labelColor) : DEFAULT_PRIMARY_COLOR;
  const accentColor = createAccentColor(primaryColor);

  // Create PDF in A4 format
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Expand items by quantity, keeping promotion status
  interface LabelData {
    product: Product;
    isPromotion: boolean;
  }
  const allLabels: LabelData[] = [];
  items.forEach(({ product, quantity, isPromotion }) => {
    for (let i = 0; i < quantity; i++) {
      allLabels.push({ product, isPromotion });
    }
  });

  // Generate pages
  const totalPages = Math.ceil(allLabels.length / LABELS_PER_PAGE);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage();
    }

    const startIdx = page * LABELS_PER_PAGE;
    const endIdx = Math.min(startIdx + LABELS_PER_PAGE, allLabels.length);

    for (let i = startIdx; i < endIdx; i++) {
      const labelIndex = i - startIdx;
      const col = labelIndex % COLS;
      const row = Math.floor(labelIndex / COLS);

      const x = MARGIN_LEFT + col * LABEL_WIDTH;
      const y = MARGIN_TOP + row * LABEL_HEIGHT;

      const { product, isPromotion } = allLabels[i];
      drawLabel(doc, x, y, product, primaryColor, accentColor, isPromotion);
    }
  }

  // Output
  if (action === "download") {
    const fileName = `etiquetas-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  } else {
    // Print: open in new window
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }
}

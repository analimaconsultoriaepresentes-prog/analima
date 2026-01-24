import jsPDF from "jspdf";
import { Product } from "@/hooks/useProducts";

interface LabelItem {
  product: Product;
  quantity: number;
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

// Helper to extract volume from product name (e.g., "Perfume XYZ 75ml" -> "75ML")
function extractVolume(name: string): string | null {
  const match = name.match(/(\d+)\s*(ml|ML|g|G|kg|KG)/i);
  if (match) {
    return `${match[1]}${match[2].toUpperCase()}`;
  }
  return null;
}

// Helper to format product name (remove volume if present, truncate)
function formatProductName(name: string, maxLength: number = 20): string {
  // Remove volume from name to avoid duplication
  let cleanName = name.replace(/\s*\d+\s*(ml|ML|g|G|kg|KG)/i, "").trim();
  if (cleanName.length > maxLength) {
    cleanName = cleanName.substring(0, maxLength - 1) + "…";
  }
  return cleanName.toUpperCase();
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
  accentColor: [number, number, number]
) {
  const volume = extractVolume(product.name);
  const productName = formatProductName(product.name, volume ? 18 : 22);
  
  // Top colored band (approximately 60% of height)
  const topHeight = LABEL_HEIGHT * 0.58;
  const bottomHeight = LABEL_HEIGHT - topHeight;

  // Draw gradient-like top band (solid color in PDF)
  doc.setFillColor(...primaryColor);
  doc.rect(x, y, LABEL_WIDTH, topHeight, "F");

  // Add slight gradient effect with overlay
  doc.setFillColor(...accentColor);
  doc.setGState(doc.GState({ opacity: 0.3 }));
  doc.rect(x + LABEL_WIDTH * 0.5, y, LABEL_WIDTH * 0.5, topHeight, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  // Product name (white, bold)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  
  const nameX = x + 2;
  const nameY = y + topHeight / 2 + 1;
  
  if (volume) {
    // Name on left, volume on right
    doc.text(productName, nameX, nameY);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.text(volume, x + LABEL_WIDTH - 2, nameY, { align: "right" });
  } else {
    doc.text(productName, nameX, nameY);
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

  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.text("CARTÃO", leftCenterX, bottomCenterY - 2, { align: "center" });

  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text(formatPrice(product.priceCard), leftCenterX, bottomCenterY + 2, { align: "center" });

  // PIX price (right side)
  const rightCenterX = x + (LABEL_WIDTH * 3) / 4;

  doc.setTextColor(...SUCCESS_COLOR);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.text("PIX", rightCenterX, bottomCenterY - 2, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text(formatPrice(product.pricePix), rightCenterX, bottomCenterY + 2, { align: "center" });

  // Optional: thin border around label (helps with cutting)
  doc.setDrawColor(200, 200, 200);
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

  // Expand items by quantity
  const allLabels: Product[] = [];
  items.forEach(({ product, quantity }) => {
    for (let i = 0; i < quantity; i++) {
      allLabels.push(product);
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

      drawLabel(doc, x, y, allLabels[i], primaryColor, accentColor);
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

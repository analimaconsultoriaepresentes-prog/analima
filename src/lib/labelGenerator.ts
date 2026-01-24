import jsPDF from "jspdf";
import { Product } from "@/hooks/useProducts";

interface LabelItem {
  product: Product;
  quantity: number;
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

// Colors - Exact match to user's model
const RED_COLOR: [number, number, number] = [139, 0, 0]; // Dark red (#8B0000)

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

// Draw a single label at position (x, y) - EXACT match to user's model
function drawLabel(
  doc: jsPDF,
  x: number,
  y: number,
  product: Product
) {
  const volume = extractVolume(product.name);
  const productName = formatProductName(product.name, 20);
  
  // Top red band (approximately 50% of height)
  const topHeight = LABEL_HEIGHT * 0.50;
  const bottomHeight = LABEL_HEIGHT - topHeight;
  const centerX = x + LABEL_WIDTH / 2;

  // Draw solid red top band
  doc.setFillColor(RED_COLOR[0], RED_COLOR[1], RED_COLOR[2]);
  doc.rect(x, y, LABEL_WIDTH, topHeight, "F");

  // Product name - white, bold, centered, uppercase
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(8);
  
  if (volume) {
    // Name on first line, volume on second line - both centered
    const nameY = y + topHeight * 0.4;
    const volumeY = y + topHeight * 0.75;
    doc.text(productName, centerX, nameY, { align: "center" });
    doc.setFontSize(7);
    doc.text(volume, centerX, volumeY, { align: "center" });
  } else {
    // Just name centered vertically
    const nameY = y + topHeight / 2 + 1;
    doc.text(productName, centerX, nameY, { align: "center" });
  }

  // Bottom white area
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y + topHeight, LABEL_WIDTH, bottomHeight, "F");

  // Prices - black, bold italic, centered, stacked vertically
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(6.5);
  
  const cardY = y + topHeight + bottomHeight * 0.38;
  const pixY = y + topHeight + bottomHeight * 0.72;
  
  // Format prices without R$ symbol to match user's model exactly
  const cardPrice = product.priceCard.toFixed(2).replace(".", ",");
  const pixPrice = product.pricePix.toFixed(2).replace(".", ",");
  
  doc.text(`Cartão: ${cardPrice}`, centerX, cardY, { align: "center" });
  doc.text(`Pix: ${pixPrice}`, centerX, pixY, { align: "center" });

  // Thin black border around label (as shown in model)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(x, y, LABEL_WIDTH, LABEL_HEIGHT);
}

export async function generateLabelsPDF(
  items: LabelItem[],
  action: "download" | "print"
): Promise<void> {
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

      drawLabel(doc, x, y, allLabels[i]);
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

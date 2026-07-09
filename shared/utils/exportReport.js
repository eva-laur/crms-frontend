// utils/exportReport.js
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

/**
 * Sanitize title for filename usage
 */
function sanitizeFilename(name = "report") {
  return name.replace(/[^\w\-]+/g, "_");
}

/**
 * Convert object array to CSV string
 */
function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return "";
  }

  const headers = Object.keys(data[0]);

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = data.map((row) =>
    headers.map((header) => escapeCSV(row[header])).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Export to CSV
 * Returns metadata + Buffer
 */
export async function toCSV(data, title = "report") {
  try {
    const csv = convertToCSV(data);
    const buffer = Buffer.from(csv, "utf-8");

    return {
      buffer,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(
          title
        )}.csv"`,
      },
    };
  } catch (error) {
    throw new Error(`CSV export failed: ${error.message}`);
  }
}

/**
 * Export to Excel
 */
export async function toExcel(data, title = "report") {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);

    if (data.length > 0) {
      const columns = Object.keys(data[0]).map((key) => ({
        header: key,
        key,
        width: 25,
      }));

      worksheet.columns = columns;
      worksheet.addRows(data);

      worksheet.getRow(1).font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(
          title
        )}.xlsx"`,
      },
    };
  } catch (error) {
    throw new Error(`Excel export failed: ${error.message}`);
  }
}

/**
 * Export to PDF
 */
export async function toPDF(data, title = "report") {
  try {
    return await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      const stream = new PassThrough();
      const chunks = [];

      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        resolve({
          buffer: Buffer.concat(chunks),
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${sanitizeFilename(
              title
            )}.pdf"`,
          },
        });
      });

      stream.on("error", reject);
      doc.pipe(stream);

      doc.fontSize(18).text(title, { align: "center" });
      doc.moveDown();

      if (data.length === 0) {
        doc.text("No data available.");
      } else {
        const headers = Object.keys(data[0]);

        data.forEach((row, index) => {
          doc.fontSize(12).text(`Record ${index + 1}`, { underline: true });

          headers.forEach((key) => {
            doc.text(`${key}: ${row[key] ?? ""}`);
          });

          doc.moveDown();
        });
      }

      doc.end(); 
    });
  } catch (error) {
    throw new Error(`PDF export failed: ${error.message}`);
  }
}
export default { toCSV,
  toExcel,
  toPDF,
};
import type { Summary } from '@shared/schema';

import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function generatePDF(summary: Summary): Promise<Buffer> {
  try {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text(summary.title, 20, 20);
    
    // Metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(summary.createdAt!).toLocaleDateString()}`, 20, 35);
    doc.text(`Word Count: ${summary.wordCount} words`, 20, 42);
    doc.text(`Tone: ${summary.tone}`, 20, 49);
    
    // Content - clean up markdown and format nicely
    doc.setFontSize(12);
    const cleanContent = summary.summaryContent
      .replace(/#{1,6}\s*/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
      .replace(/`([^`]+)`/g, '$1') // Remove code blocks
      .replace(/^[-*+]\s+/gm, '• '); // Convert markdown lists to bullet points
    
    const splitText = doc.splitTextToSize(cleanContent, 170);
    doc.text(splitText, 20, 60);
    
    return Buffer.from(doc.output('arraybuffer'));
  } catch (error: any) {
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

export async function generateDOCX(summary: Summary): Promise<Buffer> {
  try {
    // Clean up markdown formatting for professional document
    const cleanContent = summary.summaryContent
      .replace(/#{1,6}\s*/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
      .replace(/`([^`]+)`/g, '$1') // Remove code blocks
      .replace(/^[-*+]\s+/gm, '• '); // Convert markdown lists to bullet points
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: summary.title, bold: true, size: 28 })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Generated: ${new Date(summary.createdAt!).toLocaleDateString()}`, size: 20 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Word Count: ${summary.wordCount} words | Tone: ${summary.tone}`, size: 20 }),
            ],
          }),
          new Paragraph({ text: "" }), // Empty line
          new Paragraph({
            children: [new TextRun({ text: cleanContent, size: 24 })],
          }),
        ],
      }],
    });
    
    return await Packer.toBuffer(doc);
  } catch (error: any) {
    throw new Error(`DOCX generation failed: ${error.message}`);
  }
}

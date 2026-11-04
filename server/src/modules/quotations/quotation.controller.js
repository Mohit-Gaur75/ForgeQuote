// server/src/modules/quotations/quotation.controller.js
import * as quotationService from './quotation.service.js';
import * as pdfService from '../pdf/pdf.service.js';

export async function createQuotation(req, res) {
  const { rfqId } = req.params;
  const result = await quotationService.createQuotation(req.user, rfqId, req.body);
  res.status(201).json({
    success: true,
    data: result,
  });
}

export async function getQuotation(req, res) {
  const { id } = req.params;
  const result = await quotationService.getQuotationById(req.user, id);
  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function submitQuotation(req, res) {
  const { id } = req.params;
  const result = await quotationService.submitQuotation(req.user, id);
  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function sendQuotation(req, res) {
  const { id } = req.params;
  const result = await quotationService.sendQuotation(req.user, id, req.body);
  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function downloadQuotationPDF(req, res) {
  const { id } = req.params;
  const quotation = await quotationService.getQuotationById(req.user, id);
  pdfService.generateQuotationPDF(quotation, res);
}

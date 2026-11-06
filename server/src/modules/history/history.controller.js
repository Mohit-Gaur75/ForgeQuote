// server/src/modules/history/history.controller.js
import * as historyService from './history.service.js';
import {
  importHistoricalQuotesFromBuffer,
  importSample1400Archive,
  buildBlankQuoteTemplate,
} from '../excel/excel-import.service.js';
import { buildHistoricalWorkbook } from '../excel/historical-data-generator.js';
import { ValidationError } from '../../utils/errors.js';

export async function searchHistory(req, res) {
  const result = await historyService.searchHistory(req.user, req.query);
  res.status(200).json({
    success: true,
    data: result.parts,
    pagination: result.pagination,
  });
}

/**
 * Bulk import past quotes from Excel (.xlsx) file or trigger sample 1400 dataset.
 */
export async function importPastQuotes(req, res) {
  const { fileBase64, useSample1400 } = req.body || {};

  let result;
  if (useSample1400) {
    result = await importSample1400Archive(req.user);
  } else if (fileBase64) {
    const buffer = Buffer.from(fileBase64, 'base64');
    result = await importHistoricalQuotesFromBuffer(buffer, req.user);
  } else {
    throw new ValidationError('Either a base64 encoded Excel file or useSample1400 flag is required.');
  }

  res.status(200).json({
    success: true,
    data: result,
    requestId: req.id,
  });
}

/**
 * Download blank Excel import template.
 */
export async function downloadImportTemplate(req, res) {
  const workbook = buildBlankQuoteTemplate();
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="CompanyA_Past_Quotes_Template.xlsx"'
  );
  await workbook.xlsx.write(res);
  res.end();
}

/**
 * Download pre-compiled 1,400 past quotes reference Excel workbook.
 */
export async function downloadSample1400Workbook(req, res) {
  const workbook = buildHistoricalWorkbook(1400);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="CompanyA_1400_Past_Quotes_Archive.xlsx"'
  );
  await workbook.xlsx.write(res);
  res.end();
}

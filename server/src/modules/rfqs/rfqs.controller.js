// server/src/modules/rfqs/rfqs.controller.js
import * as rfqService from './rfqs.service.js';
import { generateRFQExcel } from '../excel/excel.service.js';

export async function listRFQs(req, res) {
  const result = await rfqService.listRFQs(req.user, req.query);
  return res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
    requestId: req.id,
  });
}

export async function createRFQ(req, res) {
  const rfq = await rfqService.createRFQ(req.user, req.body);
  return res.status(201).json({
    success: true,
    data: rfq,
    requestId: req.id,
  });
}

export async function getRFQ(req, res) {
  const rfq = await rfqService.getRFQById(req.user, req.params.id);
  return res.status(200).json({
    success: true,
    data: rfq,
    requestId: req.id,
  });
}

export async function updateRFQ(req, res) {
  const rfq = await rfqService.updateRFQ(req.user, req.params.id, req.body);
  return res.status(200).json({
    success: true,
    data: rfq,
    requestId: req.id,
  });
}

export async function updateRFQStatus(req, res) {
  const { status, lostReason } = req.body;
  const rfq = await rfqService.updateRFQStatus(req.user, req.params.id, status, lostReason);
  return res.status(200).json({
    success: true,
    data: rfq,
    requestId: req.id,
  });
}

export async function exportRFQExcel(req, res) {
  const workbook = await generateRFQExcel(req.params.id);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="RFQ-${req.params.id.slice(0, 8)}-BOM.xlsx"`
  );
  await workbook.xlsx.write(res);
  res.end();
}

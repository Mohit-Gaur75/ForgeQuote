// server/src/modules/rfqs/rfqs.controller.js
import * as rfqService from './rfqs.service.js';

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

// server/src/modules/parts/parts.controller.js
import * as partService from './parts.service.js';

export async function createPart(req, res) {
  const rfqId = req.params.rfqId || req.body.rfqId;
  const part = await partService.createPart(req.user, rfqId, req.body);
  return res.status(201).json({
    success: true,
    data: part,
    requestId: req.id,
  });
}

export async function getPart(req, res) {
  const part = await partService.getPartById(req.user, req.params.id);
  return res.status(200).json({
    success: true,
    data: part,
    requestId: req.id,
  });
}

export async function updatePart(req, res) {
  const part = await partService.updatePart(req.user, req.params.id, req.body);
  return res.status(200).json({
    success: true,
    data: part,
    requestId: req.id,
  });
}

export async function deletePart(req, res) {
  const result = await partService.deletePart(req.user, req.params.id);
  return res.status(200).json({
    success: true,
    data: result,
    requestId: req.id,
  });
}

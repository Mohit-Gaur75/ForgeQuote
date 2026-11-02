// server/src/modules/ai/ai.controller.js
import * as aiService from './ai.service.js';

export async function extractRFQ(req, res) {
  const result = await aiService.extractRFQ(req.user, req.params.rfqId, req.body);
  return res.status(200).json({
    success: true,
    data: result,
    requestId: req.id,
  });
}

export async function listExtractions(req, res) {
  const records = await aiService.listExtractions(req.user, req.params.rfqId);
  return res.status(200).json({
    success: true,
    data: records,
    requestId: req.id,
  });
}

export async function confirmExtraction(req, res) {
  const result = await aiService.confirmExtraction(
    req.user,
    req.params.rfqId,
    req.params.extractionId,
    req.body
  );
  return res.status(200).json({
    success: true,
    data: result,
    requestId: req.id,
  });
}

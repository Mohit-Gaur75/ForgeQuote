// server/src/modules/costing/costing.controller.js
import * as costingService from './costing.service.js';

export async function calculateCosting(req, res) {
  const result = costingService.calculateComponentCosting(req.body);
  return res.status(200).json({
    success: true,
    data: result,
    requestId: req.id,
  });
}

export async function saveCosting(req, res) {
  const result = await costingService.savePartCosting(req.user, req.params.id, req.body);
  return res.status(200).json({
    success: true,
    data: result,
    requestId: req.id,
  });
}

export async function getCosting(req, res) {
  const result = await costingService.getPartCosting(req.user, req.params.id);
  return res.status(200).json({
    success: true,
    data: result,
    requestId: req.id,
  });
}

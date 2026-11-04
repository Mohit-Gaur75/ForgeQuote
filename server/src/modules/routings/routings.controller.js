// server/src/modules/routings/routings.controller.js
import * as routingService from './routings.service.js';

export async function getSuggestions(req, res) {
  const { id } = req.params;
  const minScore = req.query.minScore ? parseFloat(req.query.minScore) : 0.5;
  const results = await routingService.getRoutingSuggestions(req.user, id, minScore);
  res.status(200).json({
    success: true,
    data: results,
  });
}

export async function applySuggestion(req, res) {
  const { id } = req.params;
  const { sourcePartId } = req.body;
  const result = await routingService.applyRoutingSuggestion(req.user, id, sourcePartId);
  res.status(200).json({
    success: true,
    data: result,
  });
}

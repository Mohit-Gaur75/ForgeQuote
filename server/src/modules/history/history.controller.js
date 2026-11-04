// server/src/modules/history/history.controller.js
import * as historyService from './history.service.js';

export async function searchHistory(req, res) {
  const result = await historyService.searchHistory(req.user, req.query);
  res.status(200).json({
    success: true,
    data: result.parts,
    pagination: result.pagination,
  });
}

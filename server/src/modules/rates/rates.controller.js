// server/src/modules/rates/rates.controller.js
import * as ratesService from './rates.service.js';

export async function listRates(req, res) {
  const result = await ratesService.listRates(req.query);
  return res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
    requestId: req.id,
  });
}

export async function getRateHistory(req, res) {
  const history = await ratesService.getRateHistory(req.params.id);
  return res.status(200).json({
    success: true,
    data: history,
    requestId: req.id,
  });
}

export async function getEffectiveRates(req, res) {
  const targetDate = req.query.at || new Date();
  const rateType = req.query.rateType || null;
  const rates = await ratesService.getEffectiveRates(targetDate, rateType);
  return res.status(200).json({
    success: true,
    data: rates,
    requestId: req.id,
  });
}

export async function createRate(req, res) {
  const rate = await ratesService.createRateVersion(req.user, req.body);
  return res.status(201).json({
    success: true,
    data: rate,
    requestId: req.id,
  });
}

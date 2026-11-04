// server/src/modules/approvals/approval.controller.js
import * as approvalService from './approval.service.js';

export async function listPendingApprovals(req, res) {
  const result = await approvalService.listPendingApprovals(req.user);
  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function processDecision(req, res) {
  const { id } = req.params;
  const result = await approvalService.processApprovalDecision(req.user, id, req.body);
  res.status(200).json({
    success: true,
    data: result,
  });
}

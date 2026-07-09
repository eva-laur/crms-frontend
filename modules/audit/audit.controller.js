import { getAuditLogsService } from "./audit.service.js";

export const getAuditLogs = async (req, res) => {
  try {
    const { module, actor, startDate, endDate, page, limit } = req.query;
    const data = await getAuditLogsService({ role: req.user.role, module, actor, startDate, endDate, page, limit });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

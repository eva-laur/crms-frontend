import Cancellation from "./cancellations.model.js";

export const createCancellationService = async ({ course, date, timeSlot, reason, cancelledBy }) => {
  const c = await Cancellation.create({ course, date, timeSlot, reason, cancelledBy });
  return c.populate([{ path: "course" }, { path: "cancelledBy", select: "name email role" }]);
};

export const getCancellationsService = async (filter = {}) => {
  return Cancellation.find(filter)
    .populate("course")
    .populate("cancelledBy", "name email role")
    .sort({ createdAt: -1 });
};

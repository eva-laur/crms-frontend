import Booking from "../bookings/bookings.model.js";

/*
Tradeoffs:
- Only bookings with startTime/endTime are used for utilization because
  utilization is based on booked hours.
- Books borrowed via dueDate are excluded because they do not represent
  reservable hourly slots.
- Aggregation is used for performance instead of JS loops.
*/

const HOURS_PER_DAY = 12;

const calculateAvailableHours = (startDate, endDate) => {
  const ms = new Date(endDate) - new Date(startDate);
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24)) || 1;
  return days * HOURS_PER_DAY;
};

export const getUtilizationByResource = async (
  startDate,
  endDate
) => {
  const availableHours = calculateAvailableHours(
    startDate,
    endDate
  );

  const result = await Booking.aggregate([
    {
      $match: {
        startTime: { $ne: null, $gte: new Date(startDate) },
        endTime: { $ne: null, $lte: new Date(endDate) },
        status: {
          $in: ["approved", "checked_out", "returned"],
        },
      },
    },

    {
      $lookup: {
        from: "resources",
        localField: "resource",
        foreignField: "_id",
        as: "resourceData",
      },
    },

    {
      $unwind: "$resourceData",
    },

    {
      $project: {
        resourceId: "$resourceData._id",
        resourceName: "$resourceData.name",
        resourceType: "$resourceData.type",
        bookedHours: {
          $divide: [
            { $subtract: ["$endTime", "$startTime"] },
            1000 * 60 * 60,
          ],
        },
      },
    },

    {
      $group: {
        _id: "$resourceId",
        resourceName: { $first: "$resourceName" },
        resourceType: { $first: "$resourceType" },
        bookingCount: { $sum: 1 },
        totalBookedHours: { $sum: "$bookedHours" },
      },
    },

    {
      $project: {
        _id: 0,
        resourceId: "$_id",
        resourceName: 1,
        resourceType: 1,
        bookingCount: 1,
        totalBookedHours: 1,
        utilizationRate: {
          $multiply: [
            {
              $divide: [
                "$totalBookedHours",
                availableHours,
              ],
            },
            100,
          ],
        },
      },
    },

    {
      $sort: {
        utilizationRate: -1,
      },
    },
  ]);

  return result;
};

export const getUtilizationByResourceType = async (
  startDate,
  endDate
) => {
  const availableHours = calculateAvailableHours(
    startDate,
    endDate
  );

  const result = await Booking.aggregate([
    {
      $match: {
        startTime: { $ne: null, $gte: new Date(startDate) },
        endTime: { $ne: null, $lte: new Date(endDate) },
        status: {
          $in: ["approved", "checked_out", "returned"],
        },
      },
    },

    {
      $lookup: {
        from: "resources",
        localField: "resource",
        foreignField: "_id",
        as: "resourceData",
      },
    },

    {
      $unwind: "$resourceData",
    },

    {
      $project: {
        resourceType: "$resourceData.type",
        bookedHours: {
          $divide: [
            { $subtract: ["$endTime", "$startTime"] },
            1000 * 60 * 60,
          ],
        },
      },
    },

    {
      $group: {
        _id: "$resourceType",
        bookingCount: { $sum: 1 },
        totalBookedHours: { $sum: "$bookedHours" },
      },
    },

    {
      $project: {
        _id: 0,
        resourceType: "$_id",
        bookingCount: 1,
        totalBookedHours: 1,
        utilizationRate: {
          $multiply: [
            {
              $divide: [
                "$totalBookedHours",
                availableHours,
              ],
            },
            100,
          ],
        },
      },
    },

    {
      $sort: {
        utilizationRate: -1,
      },
    },
  ]);

  return result;
};
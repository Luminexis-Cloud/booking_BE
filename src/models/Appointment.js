// Custom Appointment Model - Business Logic Layer
const { PrismaClient } = require("@prisma/client");
const { client } = require("../services/twilioService");

const prisma = new PrismaClient();

class Appointment {
  static validateAppointmentTime(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      return { success: false, message: "Appointment cannot be in the past" };
    }

    if (end <= start) {
      return { success: false, message: "End time must be after start time" };
    }

    const startHour = start.getHours();
    const endHour = end.getHours();

    if (startHour < 9 || endHour > 18) {
      return {
        success: false,
        message: "Appointments allowed only between 9 AM and 6 PM",
      };
    }

    return { success: true, message: "OK" };
  }

  static validateAppointmentDuration(startTime, endTime) {
    const duration = (new Date(endTime) - new Date(startTime)) / 60000;

    if (duration < 30) {
      return {
        success: false,
        message: "Appointment must be at least 30 minutes",
      };
    }

    if (duration > 120) {
      return {
        success: false,
        message: "Appointment cannot exceed 2 hours",
      };
    }

    return { success: true, message: "OK" };
  }

  /* ───────────────────────────── */
  /* CREATE */
  /* ───────────────────────────── */
  static async createAppointment(actorUserId, appointmentData) {
    console.info("[createAppointment] called", { actorUserId });

    try {
      const {
        startTime,
        endTime,
        color,

        sendSms,
        smsReminder,

        recurrence,

        downPayment,
        totalPayment,

        storeId,
        clientId,
        employeeId,

        serviceIds = [],
      } = appointmentData;

      /* ───────────────────────────── */
      /* BASIC VALIDATION */
      /* ───────────────────────────── */

      if (!storeId || !employeeId) {
        console.warn("[createAppointment] missing storeId or employeeId");
        return {
          success: false,
          message: "storeId and employeeId are required",
        };
      }

      if (!serviceIds.length) {
        console.warn("[createAppointment] no services selected");
        return {
          success: false,
          message: "At least one service must be selected",
        };
      }

      /* ───────────────────────────── */
      /* TIME VALIDATION */
      /* ───────────────────────────── */

      // const timeCheck = this.validateAppointmentTime(startTime, endTime);
      // if (!timeCheck.success) return timeCheck;

      // const durationCheck = this.validateAppointmentDuration(
      //   startTime,
      //   endTime
      // );
      // if (!durationCheck.success) return durationCheck;

      const start = new Date(startTime);
      const end = new Date(endTime);

      const dateOnly = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );

      /* ───────────────────────────── */
      /* EMPLOYEE VALIDATION */
      /* ───────────────────────────── */

      const employee = await prisma.user.findFirst({
        where: {
          id: employeeId,
          storeId,
          isActive: true,
        },
      });

      if (!employee) {
        console.warn("[createAppointment] invalid employee", {
          employeeId,
          storeId,
        });

        return {
          success: false,
          message: "Invalid employee or employee does not belong to this store",
        };
      }

      /* ───────────────────────────── */
      /* CLIENT VALIDATION */
      /* ───────────────────────────── */

      let resolvedClientId = null;

      if (clientId) {
        const client = await prisma.client.findFirst({
          where: {
            id: clientId,
            storeId,
          },
        });

        if (!client) {
          console.warn("[createAppointment] invalid client", {
            clientId,
            storeId,
          });

          return {
            success: false,
            message: "Invalid client or client does not belong to this store",
          };
        }

        resolvedClientId = client.id;
      }

      /* ───────────────────────────── */
      /* CONFLICT CHECK */
      /* ───────────────────────────── */

      const conflict = await prisma.appointment.findFirst({
        where: {
          employeeId,
          date: dateOnly,
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });

      if (conflict) {
        console.warn("[createAppointment] time conflict", {
          employeeId,
          startTime,
          endTime,
        });

        return {
          success: false,
          message: "Employee already has an appointment at this time",
        };
      }

      /* ───────────────────────────── */
      /* PAYMENT VALIDATION */
      /* ───────────────────────────── */

      if (
        downPayment != null &&
        totalPayment != null &&
        downPayment > totalPayment
      ) {
        console.warn("[createAppointment] invalid payment", {
          downPayment,
          totalPayment,
        });

        return {
          success: false,
          message: "Down payment cannot exceed total payment",
        };
      }

      /* ───────────────────────────── */
      /* RECURRENCE VALIDATION */
      /* ───────────────────────────── */

      if (recurrence) {
        if (!recurrence.type) {
          console.warn("[createAppointment] recurrence missing type");
          return {
            success: false,
            message: "recurrence.type is required",
          };
        }

        if (
          recurrence.type === "weekly" &&
          (!Array.isArray(recurrence.days) || !recurrence.days.length)
        ) {
          console.warn("[createAppointment] invalid weekly recurrence");
          return {
            success: false,
            message: "Weekly recurrence requires at least one day",
          };
        }
      }

      /* ───────────────────────────── */
      /* CREATE APPOINTMENT */
      /* ───────────────────────────── */

      const appointment = await prisma.appointment.create({
        data: {
          date: dateOnly,
          startTime: start,
          endTime: end,

          color: color || "gold",

          recurrence: recurrence ?? null,

          downPayment: downPayment ?? null,
          totalPayment: totalPayment ?? null,

          sendSms: !!sendSms,
          smsReminder: sendSms ? smsReminder : null,

          storeId,
          employeeId,
          clientId: resolvedClientId,
        },
      });

      await prisma.appointmentService.createMany({
        data: serviceIds.map((serviceId) => ({
          appointmentId: appointment.id,
          serviceId,
        })),
        skipDuplicates: true,
      });

      console.info("[createAppointment] success", {
        appointmentId: appointment.id,
      });

      return {
        success: true,
        message: "Appointment created successfully",
        data: appointment,
      };
    } catch (error) {
      console.error("[createAppointment] unexpected error", error);

      return {
        success: false,
        message: "Failed to create appointment",
      };
    }
  }

  /* ───────────────────────────── */
  /* GET */
  /* ───────────────────────────── */
  static async getUserAppointments({ storeId, employeeIds }) {
    return prisma.appointment.findMany({
      where: {
        storeId,

        // ✅ employeeId IN array (optional)
        ...(employeeIds?.length && {
          userId: { in: employeeIds },
        }),
      },

      orderBy: { startTime: "asc" },

      include: {
        user: true, // employee
        client: true,
        services: {
          include: { service: true },
        },
      },
    });
  }

  /* ───────────────────────────── */
  /* UPDATE */
  /* ───────────────────────────── */
  static async updateAppointment(appointmentId, userId, updateData) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, userId },
    });

    if (!appointment) {
      throw new Error("Appointment not found or access denied");
    }

    if (updateData.startTime || updateData.endTime) {
      this.validateAppointmentTime(
        updateData.startTime || appointment.startTime,
        updateData.endTime || appointment.endTime
      );
      this.validateAppointmentDuration(
        updateData.startTime || appointment.startTime,
        updateData.endTime || appointment.endTime
      );
    }

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    });
  }

  /* ───────────────────────────── */
  /* DELETE */
  /* ───────────────────────────── */
  static async deleteAppointment(appointmentId, userId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, userId },
    });

    if (!appointment) {
      throw new Error("Appointment not found or access denied");
    }

    if (new Date(appointment.startTime) < new Date()) {
      throw new Error("Cannot delete past appointments");
    }

    await prisma.appointment.delete({ where: { id: appointmentId } });

    return { message: "Appointment deleted successfully" };
  }

  static async hasPermission(userId, module, action) {
    const count = await prisma.rolePermission.count({
      where: {
        permission: {
          module,
          action,
        },
        role: {
          users: {
            some: { id: userId },
          },
        },
      },
    });

    return count > 0;
  }
}

module.exports = Appointment;

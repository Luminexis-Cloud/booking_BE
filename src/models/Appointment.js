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
        return {
          success: false,
          message: "storeId and employeeId are required",
        };
      }

      if (!clientId) {
        return { success: false, message: "clientId is required" };
      }

      if (!serviceIds.length) {
        return {
          success: false,
          message: "At least one service must be selected",
        };
      }

      /* ───────────────────────────── */
      /* TIME VALIDATION */
      /* ───────────────────────────── */

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
        where: { id: employeeId, storeId, isActive: true },
      });

      if (!employee) {
        return {
          success: false,
          message: "Invalid employee or employee does not belong to this store",
        };
      }

      /* ───────────────────────────── */
      /* CLIENT VALIDATION */
      /* ───────────────────────────── */

      const client = await prisma.client.findFirst({
        where: { id: clientId, storeId },
      });

      if (!client) {
        return {
          success: false,
          message: "Invalid client or client does not belong to this store",
        };
      }

      /* ───────────────────────────── */
      /* SERVICE VALIDATION (🔥 FIX) */
      /* ───────────────────────────── */

      const services = await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          storeId,
        },
      });

      if (services.length !== serviceIds.length) {
        return {
          success: false,
          message:
            "One or more selected services are invalid or do not belong to this store",
        };
      }

      /* ───────────────────────────── */
      /* CONFLICT CHECK */
      /* ───────────────────────────── */

      // const conflict = await prisma.appointment.findFirst({
      //   where: {
      //     employeeId,
      //     date: dateOnly,
      //     startTime: { lt: end },
      //     endTime: { gt: start },
      //   },
      // });

      // if (conflict) {
      //   return {
      //     success: false,
      //     message: "Employee already has an appointment at this time",
      //   };
      // }

      /* ───────────────────────────── */
      /* PAYMENT VALIDATION */
      /* ───────────────────────────── */

      if (
        downPayment != null &&
        totalPayment != null &&
        downPayment > totalPayment
      ) {
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
          return { success: false, message: "recurrence.type is required" };
        }

        if (
          recurrence.type === "weekly" &&
          (!Array.isArray(recurrence.days) || !recurrence.days.length)
        ) {
          return {
            success: false,
            message: "Weekly recurrence requires at least one day",
          };
        }
      }

      /* ───────────────────────────── */
      /* CREATE (TRANSACTION SAFE) */
      /* ───────────────────────────── */

      const appointment = await prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
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
            clientId,
          },
        });

        await tx.appointmentService.createMany({
          data: services.map((service) => ({
            appointmentId: appointment.id,
            serviceId: service.id,
          })),
        });

        return appointment;
      });

      return {
        success: true,
        message: "Appointment created successfully",
        data: appointment,
      };
    } catch (error) {
      console.error("[createAppointment] unexpected error", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      return { success: false, message: error.message };
    }
  }

  /* ───────────────────────────── */
  /* GET */
  /* ───────────────────────────── */
  static async getUserAppointments({ storeId, employeeIds }) {
    return prisma.appointment.findMany({
      where: {
        storeId,
        ...(employeeIds?.length && {
          userId: { in: employeeIds },
        }),
      },
      orderBy: { startTime: "asc" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            birthday: true,
          },
        },
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
    return prisma.$transaction(async (tx) => {
      // 🔒 Ownership check
      const appointment = await tx.appointment.findFirst({
        where: {
          id: appointmentId,
          userId,
        },
        select: { id: true },
      });

      if (!appointment) {
        throw new Error("Appointment not found or access denied");
      }

      // ✏️ Update main appointment fields
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          startTime: updateData.startTime
            ? new Date(updateData.startTime)
            : undefined,
          endTime: updateData.endTime
            ? new Date(updateData.endTime)
            : undefined,

          color: updateData.color,
          recurrence: updateData.recurrence ?? null,

          employeeId: updateData.employeeId,
          clientId: updateData.clientId,

          downPayment: updateData.downPayment,
          totalPayment: updateData.totalPayment,

          sendSms: updateData.sendSms,
          smsReminder: updateData.smsReminder,
        },
      });

      // 🔄 Replace services if provided
      if (Array.isArray(updateData.serviceIds)) {
        await tx.appointmentService.deleteMany({
          where: { appointmentId },
        });

        if (updateData.serviceIds.length) {
          await tx.appointmentService.createMany({
            data: updateData.serviceIds.map((serviceId) => ({
              appointmentId,
              serviceId,
            })),
          });
        }
      }

      // 🔁 Return appointment in CREATE shape
      const updatedAppointment = await tx.appointment.findFirst({
        where: {
          id: appointmentId,
        },
        select: {
          startTime: true,
          endTime: true,
          color: true,
          recurrence: true,

          storeId: true,
          employeeId: true,
          clientId: true,

          downPayment: true,
          totalPayment: true,
          sendSms: true,
          smsReminder: true,

          services: {
            select: {
              serviceId: true,
            },
          },
        },
      });

      return {
        startTime: updatedAppointment.startTime,
        endTime: updatedAppointment.endTime,
        color: updatedAppointment.color,
        recurrence: updatedAppointment.recurrence ?? null,

        storeId: updatedAppointment.storeId,
        employeeId: updatedAppointment.employeeId,
        clientId: updatedAppointment.clientId,

        serviceIds: updatedAppointment.services.map((s) => s.serviceId),

        downPayment: updatedAppointment.downPayment,
        totalPayment: updatedAppointment.totalPayment,
        sendSms: updatedAppointment.sendSms,
        smsReminder: updatedAppointment.smsReminder,
      };
    });
  }

  /* ───────────────────────────── */
  /* DELETE */
  /* ───────────────────────────── */
  static async deleteAppointment(appointmentId, userId) {
    const requestId = Date.now();

    console.log(`[${requestId}] DELETE_APPOINTMENT_START`, {
      appointmentId,
      userId,
    });

    try {
      // 🔍 Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        console.warn(`[${requestId}] DELETE_APPOINTMENT_USER_NOT_FOUND`, {
          userId,
        });
        throw Object.assign(new Error("User not found"), { statusCode: 404 });
      }

      // 🔍 Verify appointment exists
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { id: true, startTime: true },
      });

      if (!appointment) {
        console.warn(`[${requestId}] DELETE_APPOINTMENT_NOT_FOUND`, {
          appointmentId,
        });
        throw Object.assign(
          new Error("Appointment not found or access denied"),
          { statusCode: 404 }
        );
      }

      // 🗑️ Delete appointment
      await prisma.appointment.delete({
        where: { id: appointmentId },
      });

      console.log(`[${requestId}] DELETE_APPOINTMENT_SUCCESS`, {
        appointmentId,
      });

      return {
        success: true,
        message: "Appointment deleted successfully",
      };
    } catch (error) {
      console.error(`[${requestId}] DELETE_APPOINTMENT_ERROR`, {
        message: error.message,
        statusCode: error.statusCode || 500,
        stack: error.stack,
      });

      throw error;
    }
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

// Custom Appointment Model - Business Logic Layer
const { PrismaClient } = require("@prisma/client");
const { client } = require("../services/twilioService");

const prisma = new PrismaClient();

class Appointment {
  /* ───────────────────────────── */
  /* VALIDATIONS */
  /* ───────────────────────────── */
  static validateAppointmentTime(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      throw new Error("Appointment cannot be scheduled in the past");
    }

    if (end <= start) {
      throw new Error("End time must be after start time");
    }

    const startHour = start.getHours();
    const endHour = end.getHours();

    if (startHour < 9 || endHour > 18) {
      throw new Error(
        "Appointments can only be scheduled between 9 AM and 6 PM"
      );
    }

    return true;
  }

  static validateAppointmentDuration(startTime, endTime) {
    const duration = (new Date(endTime) - new Date(startTime)) / 60000;

    if (duration < 30) {
      throw new Error("Appointment must be at least 30 minutes long");
    }

    if (duration > 120) {
      throw new Error("Appointment cannot be longer than 2 hours");
    }

    return true;
  }

  /* ───────────────────────────── */
  /* CREATE */
  /* ───────────────────────────── */
  static async createAppointment(actorUserId, appointmentData) {
    const {
      title,
      notes,
      startTime,
      endTime,
      color,
      sendSms,
      smsMessage,
      isRecurring,
      recurrence,
      recurrenceConfig,
      downPayment,
      storeId,
      clientId,
      employeeId, // ✅ REQUIRED
      services = [],
    } = appointmentData;

    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        storeId,
        isActive: true,
      },
    });

    if (!employee) {
      throw new Error(
        "Invalid employeeId or employee does not belong to store"
      );
    }

    // Business rules
    this.validateAppointmentTime(startTime, endTime);
    this.validateAppointmentDuration(startTime, endTime);

    // Conflict check (same user)
    const conflict = await prisma.appointment.findFirst({
      where: {
        userId: employeeId,
        OR: [
          {
            startTime: { lte: new Date(startTime) },
            endTime: { gt: new Date(startTime) },
          },
          {
            startTime: { lt: new Date(endTime) },
            endTime: { gte: new Date(endTime) },
          },
        ],
      },
    });

    if (conflict) {
      throw new Error("You already have an appointment at this time");
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const dateOnly = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );

    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        const err = new Error(
          "Invalid clientId. Use Client.id, not Client.clientId"
        );
        err.statusCode = 400;
        throw err;
      }
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        title,
        notes,

        date: dateOnly,
        startTime: start,
        endTime: end,

        color: color || "gold",

        sendSms: !!sendSms,
        smsMessage: sendSms ? smsMessage : null,

        isRecurring: !!isRecurring,
        recurrence: isRecurring ? recurrence : null,
        recurrenceConfig: isRecurring ? recurrenceConfig : null,

        downPayment: downPayment ?? null,

        storeId,
        userId: employeeId, // ✅ THIS IS THE FIX
        clientId: client.id,
      },
    });

    // Create AppointmentService relations
    if (services.length) {
      await prisma.appointmentService.createMany({
        data: services.map((s) => ({
          appointmentId: appointment.id,
          serviceId: s.serviceId,
        })),
        skipDuplicates: true,
      });
    }

    return appointment;
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

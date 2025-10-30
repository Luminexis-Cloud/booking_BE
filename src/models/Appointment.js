// Custom Appointment Model - Business Logic Layer
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class Appointment {
  // Business validation rules
  static validateAppointmentTime(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      throw new Error('Appointment cannot be scheduled in the past');
    }

    if (end <= start) {
      throw new Error('End time must be after start time');
    }

    // Check if appointment is within business hours (9 AM - 6 PM)
    const startHour = start.getHours();
    const endHour = end.getHours();
    
    if (startHour < 9 || endHour > 18) {
      throw new Error('Appointments can only be scheduled between 9 AM and 6 PM');
    }

    return true;
  }

  static validateAppointmentDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = (end - start) / (1000 * 60); // duration in minutes

    if (duration < 30) {
      throw new Error('Appointment must be at least 30 minutes long');
    }

    if (duration > 120) {
      throw new Error('Appointment cannot be longer than 2 hours');
    }

    return true;
  }

  // Business logic for creating appointment
  static async createAppointment(userId, appointmentData) {
    const { title, description, startTime, endTime, type } = appointmentData;

    // Validate using business rules
    this.validateAppointmentTime(startTime, endTime);
    this.validateAppointmentDuration(startTime, endTime);

    // Check for conflicts (business rule)
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        userId,
        OR: [
          {
            startTime: {
              lte: new Date(startTime),
            },
            endTime: {
              gt: new Date(startTime),
            },
          },
          {
            startTime: {
              lt: new Date(endTime),
            },
            endTime: {
              gte: new Date(endTime),
            },
          },
        ],
      },
    });

    if (conflictingAppointment) {
      throw new Error('You already have an appointment at this time');
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type,
        userId,
      },
    });

    return appointment;
  }

  // Business logic for getting user appointments
  static async getUserAppointments(userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return appointments;
  }

  // Business logic for updating appointment
  static async updateAppointment(appointmentId, userId, updateData) {
    // Check if appointment exists and belongs to user
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        userId,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found or you do not have permission to update it');
    }

    // Validate if updating time
    if (updateData.startTime || updateData.endTime) {
      const startTime = updateData.startTime || appointment.startTime;
      const endTime = updateData.endTime || appointment.endTime;
      
      this.validateAppointmentTime(startTime, endTime);
      this.validateAppointmentDuration(startTime, endTime);
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    });

    return updatedAppointment;
  }

  // Business logic for deleting appointment
  static async deleteAppointment(appointmentId, userId) {
    // Check if appointment exists and belongs to user
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        userId,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found or you do not have permission to delete it');
    }

    // Check if appointment is in the past
    if (new Date(appointment.startTime) < new Date()) {
      throw new Error('Cannot delete past appointments');
    }

    // Delete appointment
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    return { message: 'Appointment deleted successfully' };
  }
}

module.exports = Appointment;

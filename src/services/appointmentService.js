const Appointment = require('../models/Appointment');

class AppointmentService {
  async createAppointment(actorUserId, appointmentData) {
    return Appointment.createAppointment(actorUserId, appointmentData);
  }

  async getUserAppointments(userId, date) {
    return await Appointment.getUserAppointments(userId, date);
  }

  async updateAppointment(appointmentId, userId, updateData) {
    return await Appointment.updateAppointment(
      appointmentId,
      userId,
      updateData
    );
  }

  async deleteAppointment(appointmentId, userId) {
    return await Appointment.deleteAppointment(appointmentId, userId);
  }
}

module.exports = new AppointmentService();

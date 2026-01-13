const Appointment = require('../models/Appointment');

class AppointmentService {
  async createAppointment(actorUserId, appointmentData) {
    return Appointment.createAppointment(actorUserId, appointmentData);
  }

  async getUserAppointments({ storeId, employeeIds }) {
    return await Appointment.getUserAppointments({ storeId, employeeIds });
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

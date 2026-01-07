const appointmentService = require('../services/appointmentService');

class AppointmentController {

  async createAppointment(req, res, next) {
    const requestId = Date.now();

    try {
      const userId = req.user.userId;
      const appointmentData = req.body;

      console.log(`[${requestId}] CREATE_APPOINTMENT_REQUEST`, {
        userId,
        appointmentData,
      });

      const appointment = await appointmentService.createAppointment(
        userId,
        appointmentData
      );

      console.log(`[${requestId}] CREATE_APPOINTMENT_SUCCESS`, {
        appointmentId: appointment.id,
      });

      return res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        data: { appointment },
      });

    } catch (error) {
      console.error(`[${requestId}] CREATE_APPOINTMENT_ERROR`, error);
      next(error);
    }
  }

  async getUserAppointments(req, res, next) {
    const requestId = Date.now();

    try {
      const userId = req.user.userId;
      const { date } = req.query;

      console.log(`[${requestId}] GET_APPOINTMENTS_REQUEST`, {
        userId,
        date,
      });

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date parameter is required",
        });
      }

      const appointments = await appointmentService.getUserAppointments(
        userId,
        date
      );

      console.log(`[${requestId}] GET_APPOINTMENTS_SUCCESS`, {
        count: appointments.length,
      });

      return res.status(200).json({
        success: true,
        message: "Appointments retrieved successfully",
        data: { appointments },
      });

    } catch (error) {
      console.error(`[${requestId}] GET_APPOINTMENTS_ERROR`, error);
      next(error);
    }
  }

  async updateAppointment(req, res, next) {
    const requestId = Date.now();

    try {
      const userId = req.user.userId;
      const { appointmentId } = req.params;
      const updateData = req.body;

      console.log(`[${requestId}] UPDATE_APPOINTMENT_REQUEST`, {
        userId,
        appointmentId,
        updateData,
      });

      const appointment = await appointmentService.updateAppointment(
        appointmentId,
        userId,
        updateData
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      console.log(`[${requestId}] UPDATE_APPOINTMENT_SUCCESS`, {
        appointmentId,
      });

      return res.status(200).json({
        success: true,
        message: "Appointment updated successfully",
        data: { appointment },
      });

    } catch (error) {
      console.error(`[${requestId}] UPDATE_APPOINTMENT_ERROR`, error);
      next(error);
    }
  }

  async deleteAppointment(req, res, next) {
    const requestId = Date.now();

    try {
      const userId = req.user.userId;
      const { appointmentId } = req.params;

      console.log(`[${requestId}] DELETE_APPOINTMENT_REQUEST`, {
        userId,
        appointmentId,
      });

      const result = await appointmentService.deleteAppointment(
        appointmentId,
        userId
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      console.log(`[${requestId}] DELETE_APPOINTMENT_SUCCESS`, {
        appointmentId,
      });

      return res.status(200).json({
        success: true,
        message: "Appointment deleted successfully",
      });

    } catch (error) {
      console.error(`[${requestId}] DELETE_APPOINTMENT_ERROR`, error);
      next(error);
    }
  }
}

module.exports = new AppointmentController();

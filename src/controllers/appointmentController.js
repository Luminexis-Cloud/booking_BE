const appointmentService = require('../services/appointmentService');

class AppointmentController {
  async createAppointment(req, res, next) {
    try {
      const userId = req.user.userId;
      const appointmentData = req.body;

      const appointment = await appointmentService.createAppointment(userId, appointmentData);

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserAppointments(req, res, next) {
    try {
      const userId = req.user.userId;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date parameter is required',
        });
      }

      const appointments = await appointmentService.getUserAppointments(userId, date);

      res.status(200).json({
        success: true,
        message: 'Appointments retrieved successfully',
        data: { appointments },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAppointment(req, res, next) {
    try {
      const userId = req.user.userId;
      const { appointmentId } = req.params;
      const updateData = req.body;

      const appointment = await appointmentService.updateAppointment(appointmentId, userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Appointment updated successfully',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAppointment(req, res, next) {
    try {
      const userId = req.user.userId;
      const { appointmentId } = req.params;

      const result = await appointmentService.deleteAppointment(appointmentId, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AppointmentController();

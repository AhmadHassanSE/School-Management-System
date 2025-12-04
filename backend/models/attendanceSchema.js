const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'student',
            required: true,
        },
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'sclass',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['Present', 'Absent', 'Leave', 'Sick'],
            default: 'Absent',
        },
        remarks: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model('attendance', attendanceSchema);
const bcrypt = require('bcrypt');
const Admin = require('../models/adminSchema');
const Sclass = require('../models/sclassSchema');
const Student = require('../models/studentSchema');
const Teacher = require('../models/teacherSchema');
const Subject = require('../models/subjectSchema');
const Notice = require('../models/noticeSchema');
const Complain = require('../models/complainSchema');

// Admin Registration
const adminRegister = async (req, res) => {
    try {
        const { name, email, password, schoolName } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Name is required' });
        }

        if (!email || email.trim() === '') {
            return res.status(400).json({ message: 'Email is required' });
        }

        if (!password || password.trim() === '') {
            return res.status(400).json({ message: 'Password is required' });
        }

        if (!schoolName || schoolName.trim() === '') {
            return res.status(400).json({ message: 'School name is required' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Password length validation
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Name length validation
        if (name.trim().length > 100) {
            return res.status(400).json({ message: 'Name is too long' });
        }

        // Email length validation
        if (email.trim().length > 255) {
            return res.status(400).json({ message: 'Email is too long' });
        }

        // Check for XSS in name
        const xssRegex = /<script|<\/script|javascript:|onerror=|onload=/i;
        if (xssRegex.test(name)) {
            return res.status(400).json({ message: 'Invalid characters in name' });
        }

        // Sanitize inputs
        const sanitizedEmail = email.trim().toLowerCase();
        const sanitizedName = name.trim();
        const sanitizedSchoolName = schoolName.trim();

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: sanitizedEmail });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin
        const admin = new Admin({
            name: sanitizedName,
            email: sanitizedEmail,
            password: hashedPassword,
            role: 'Admin',
            schoolName: sanitizedSchoolName
        });

        // Save admin
        await admin.save();

        // Return admin without password
        const adminResponse = {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            schoolName: admin.schoolName
        };

        res.send(adminResponse);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin Login
const adminLogIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation - check for missing or empty fields
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Trim and convert email to lowercase
        const sanitizedEmail = email.trim().toLowerCase();

        // Find admin by email
        const admin = await Admin.findOne({ email: sanitizedEmail });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Return admin without password
        const adminResponse = {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            schoolName: admin.schoolName
        };

        res.status(200).json(adminResponse);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Admin Detail
const getAdminDetail = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).select('-password');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json(admin);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get All Admins
const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        res.status(200).json(admins);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Admin
const updateAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const adminId = req.params.id;

        const updateData = {};

        if (name) {
            updateData.name = name.trim();
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            const existingAdmin = await Admin.findOne({ 
                email: email.trim().toLowerCase(),
                _id: { $ne: adminId }
            });

            if (existingAdmin) {
                return res.status(400).json({ message: 'Email already exists' });
            }

            updateData.email = email.trim().toLowerCase();
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters long' });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedAdmin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json(updatedAdmin);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Admin
const deleteAdmin = async (req, res) => {
    try {
        const adminId = req.params.id;

        const admin = await Admin.findById(adminId);
        
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Delete all related data
        await Sclass.deleteMany({ school: adminId });
        await Student.deleteMany({ school: adminId });
        await Teacher.deleteMany({ school: adminId });
        await Subject.deleteMany({ school: adminId });
        await Notice.deleteMany({ school: adminId });
        await Complain.deleteMany({ school: adminId });

        // Delete admin
        await Admin.findByIdAndDelete(adminId);

        res.status(200).json({ message: 'Admin and all related data deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Dashboard Statistics
const getDashboard = async (req, res) => {
    try {
        const adminId = req.params.id;

        const admin = await Admin.findById(adminId);
        
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const studentCount = await Student.countDocuments({ school: adminId });
        const teacherCount = await Teacher.countDocuments({ school: adminId });
        const classCount = await Sclass.countDocuments({ school: adminId });
        const subjectCount = await Subject.countDocuments({ school: adminId });

        res.status(200).json({
            students: studentCount,
            teachers: teacherCount,
            classes: classCount,
            subjects: subjectCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    adminRegister,
    adminLogIn,
    getAdminDetail,
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    getDashboard
};

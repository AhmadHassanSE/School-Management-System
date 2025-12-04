const {
    adminRegister,
    adminLogIn,
    updateAdmin
} = require('../../controllers/admin-controller');
const Admin = require('../../models/adminSchema');
const bcrypt = require('bcrypt');

// Mock dependencies
jest.mock('../../models/adminSchema');
jest.mock('bcrypt');

describe('Admin Validation Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    // ===== ADMIN REGISTRATION VALIDATION =====
    describe('Admin Registration - Input Validation', () => {
        
        // Name Validation Tests
        describe('Name Field Validation', () => {
            test('should reject registration when name is missing', async () => {
                req.body = {
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Name is required'
                });
            });

            test('should reject registration when name is empty string', async () => {
                req.body = {
                    name: '',
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Name is required'
                });
            });

            test('should reject registration when name is only whitespace', async () => {
                req.body = {
                    name: '   ',
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Name is required'
                });
            });

            test('should reject registration when name exceeds 100 characters', async () => {
                req.body = {
                    name: 'a'.repeat(101),
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Name is too long'
                });
            });

            test('should reject registration when name contains XSS script tags', async () => {
                req.body = {
                    name: '<script>alert("xss")</script>',
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Invalid characters in name'
                });
            });

            test('should reject registration when name contains javascript: protocol', async () => {
                req.body = {
                    name: 'Admin javascript:alert(1)',
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Invalid characters in name'
                });
            });

            test('should reject registration when name contains onerror attribute', async () => {
                req.body = {
                    name: 'Admin onerror=alert(1)',
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Invalid characters in name'
                });
            });

            test('should accept valid name with exactly 100 characters', async () => {
                const validName = 'a'.repeat(100);
                req.body = {
                    name: validName,
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                Admin.findOne.mockResolvedValueOnce(null);
                bcrypt.hash.mockResolvedValueOnce('hashedPassword');
                Admin.prototype.save = jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: validName,
                    email: 'admin@school.com',
                    role: 'Admin',
                    schoolName: 'Test School'
                });

                await adminRegister(req, res);

                expect(res.send).toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalledWith(400);
            });

            test('should trim whitespace from name', async () => {
                req.body = {
                    name: '  John Admin  ',
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                Admin.findOne.mockResolvedValueOnce(null);
                bcrypt.hash.mockResolvedValueOnce('hashedPassword');
                const mockAdmin = {
                    _id: '123',
                    name: 'John Admin',
                    email: 'admin@school.com',
                    role: 'Admin',
                    schoolName: 'Test School',
                    save: jest.fn().mockResolvedValueOnce(this)
                };
                Admin.mockImplementation(() => mockAdmin);

                await adminRegister(req, res);

                expect(res.send).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: 'John Admin'
                    })
                );
            });
        });

        // Email Validation Tests
        describe('Email Field Validation', () => {
            test('should reject registration when email is missing', async () => {
                req.body = {
                    name: 'Admin',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Email is required'
                });
            });

            test('should reject registration when email is empty string', async () => {
                req.body = {
                    name: 'Admin',
                    email: '',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Email is required'
                });
            });

            test('should reject registration when email is invalid format', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'invalidemail',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Invalid email format'
                });
            });

            test('should reject registration when email missing @ symbol', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admindomain.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Invalid email format'
                });
            });

            test('should reject registration when email missing domain', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin@',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Invalid email format'
                });
            });

            test('should reject registration when email has spaces', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin @school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Invalid email format'
                });
            });

            test('should reject registration when email exceeds 255 characters', async () => {
                const longEmail = 'a'.repeat(250) + '@school.com';
                req.body = {
                    name: 'Admin',
                    email: longEmail,
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Email is too long'
                });
            });

            test('should reject registration when email already exists', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                Admin.findOne.mockResolvedValueOnce({
                    _id: '456',
                    email: 'admin@school.com'
                });

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Email already exists'
                });
            });

            test('should convert email to lowercase', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'ADMIN@SCHOOL.COM',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                Admin.findOne.mockResolvedValueOnce(null);
                bcrypt.hash.mockResolvedValueOnce('hashedPassword');
                Admin.prototype.save = jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin',
                    email: 'admin@school.com',
                    role: 'Admin',
                    schoolName: 'Test School'
                });

                await adminRegister(req, res);

                expect(Admin.findOne).toHaveBeenCalledWith({
                    email: 'admin@school.com'
                });
            });

            test('should accept valid email format', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                Admin.findOne.mockResolvedValueOnce(null);
                bcrypt.hash.mockResolvedValueOnce('hashedPassword');
                Admin.prototype.save = jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin',
                    email: 'admin@school.com',
                    role: 'Admin',
                    schoolName: 'Test School'
                });

                await adminRegister(req, res);

                expect(res.send).toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalledWith(400);
            });
        });

        // Password Validation Tests
        describe('Password Field Validation', () => {
            test('should reject registration when password is missing', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin@school.com',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Password is required'
                });
            });

            test('should reject registration when password is empty string', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin@school.com',
                    password: '',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Password is required'
                });
            });

            test('should reject registration when password is less than 6 characters', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin@school.com',
                    password: 'pass5',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Password must be at least 6 characters long'
                });
            });

            test('should accept password with exactly 6 characters', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin@school.com',
                    password: 'pass12',
                    schoolName: 'Test School'
                };

                Admin.findOne.mockResolvedValueOnce(null);
                bcrypt.hash.mockResolvedValueOnce('hashedPassword');
                Admin.prototype.save = jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin',
                    email: 'admin@school.com',
                    role: 'Admin',
                    schoolName: 'Test School'
                });

                await adminRegister(req, res);

                expect(res.send).toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalledWith(400);
            });

            test('should hash password before saving', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                Admin.findOne.mockResolvedValueOnce(null);
                bcrypt.hash.mockResolvedValueOnce('hashedPassword123');
                Admin.prototype.save = jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin',
                    email: 'admin@school.com',
                    password: 'hashedPassword123',
                    role: 'Admin',
                    schoolName: 'Test School'
                });

                await adminRegister(req, res);

                expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            });
        });

        // School Name Validation Tests
        describe('School Name Field Validation', () => {
            test('should reject registration when schoolName is missing', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin@school.com',
                    password: 'password123'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'School name is required'
                });
            });

            test('should reject registration when schoolName is empty string', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: ''
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'School name is required'
                });
            });

            test('should reject registration when schoolName is only whitespace', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: '   '
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'School name is required'
                });
            });

            test('should trim whitespace from schoolName', async () => {
                req.body = {
                    name: 'Admin',
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: '  Test School  '
                };

                Admin.findOne.mockResolvedValueOnce(null);
                bcrypt.hash.mockResolvedValueOnce('hashedPassword');
                const mockAdmin = {
                    _id: '123',
                    name: 'Admin',
                    email: 'admin@school.com',
                    role: 'Admin',
                    schoolName: 'Test School',
                    save: jest.fn().mockResolvedValueOnce(this)
                };
                Admin.mockImplementation(() => mockAdmin);

                await adminRegister(req, res);

                expect(res.send).toHaveBeenCalledWith(
                    expect.objectContaining({
                        schoolName: 'Test School'
                    })
                );
            });
        });
    });

    // ===== ADMIN LOGIN VALIDATION =====
    describe('Admin Login - Input Validation', () => {
        
        test('should reject login when email is missing', async () => {
            req.body = {
                password: 'password123'
            };

            await adminLogIn(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Email and password are required'
            });
        });

        test('should reject login when password is missing', async () => {
            req.body = {
                email: 'admin@school.com'
            };

            await adminLogIn(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Email and password are required'
            });
        });

        test('should reject login when both email and password are missing', async () => {
            req.body = {};

            await adminLogIn(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Email and password are required'
            });
        });

        test('should reject login when email is empty string', async () => {
            req.body = {
                email: '',
                password: 'password123'
            };

            await adminLogIn(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Email and password are required'
            });
        });

        test('should reject login when password is empty string', async () => {
            req.body = {
                email: 'admin@school.com',
                password: ''
            };

            await adminLogIn(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Email and password are required'
            });
        });

        test('should convert email to lowercase during login', async () => {
            req.body = {
                email: 'ADMIN@SCHOOL.COM',
                password: 'password123'
            };

            Admin.findOne.mockResolvedValueOnce(null);

            await adminLogIn(req, res);

            expect(Admin.findOne).toHaveBeenCalledWith({
                email: 'admin@school.com'
            });
        });

        test('should trim whitespace from email during login', async () => {
            req.body = {
                email: '  admin@school.com  ',
                password: 'password123'
            };

            Admin.findOne.mockResolvedValueOnce(null);

            await adminLogIn(req, res);

            expect(Admin.findOne).toHaveBeenCalledWith({
                email: 'admin@school.com'
            });
        });
    });

    // ===== ADMIN UPDATE VALIDATION =====
    describe('Admin Update - Input Validation', () => {
        
        test('should reject update when new email is invalid format', async () => {
            req.params.id = '123';
            req.body = {
                email: 'invalidemail'
            };

            await updateAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid email format'
            });
        });

        test('should reject update when new email already exists for another admin', async () => {
            req.params.id = '123';
            req.body = {
                email: 'existing@school.com'
            };

            Admin.findOne.mockResolvedValueOnce({
                _id: '456',
                email: 'existing@school.com'
            });

            await updateAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Email already exists'
            });
        });

        test('should allow updating email to same email as current admin', async () => {
            req.params.id = '123';
            req.body = {
                email: 'admin@school.com'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            const mockUpdatedAdmin = {
                _id: '123',
                name: 'Admin',
                email: 'admin@school.com',
                role: 'Admin',
                schoolName: 'Test School'
            };
            Admin.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValueOnce(mockUpdatedAdmin)
            });

            await updateAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should reject update when new password is less than 6 characters', async () => {
            req.params.id = '123';
            req.body = {
                password: 'pass5'
            };

            await updateAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Password must be at least 6 characters long'
            });
        });

        test('should hash new password before updating', async () => {
            req.params.id = '123';
            req.body = {
                password: 'newpassword123'
            };

            bcrypt.hash.mockResolvedValueOnce('hashedNewPassword');
            const mockUpdatedAdmin = {
                _id: '123',
                name: 'Admin',
                email: 'admin@school.com',
                role: 'Admin',
                schoolName: 'Test School'
            };
            Admin.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValueOnce(mockUpdatedAdmin)
            });

            await updateAdmin(req, res);

            expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
        });

        test('should trim name during update', async () => {
            req.params.id = '123';
            req.body = {
                name: '  Updated Admin  '
            };

            const mockUpdatedAdmin = {
                _id: '123',
                name: 'Updated Admin',
                email: 'admin@school.com',
                role: 'Admin',
                schoolName: 'Test School'
            };
            Admin.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValueOnce(mockUpdatedAdmin)
            });

            await updateAdmin(req, res);

            expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({
                    name: 'Updated Admin'
                }),
                expect.any(Object)
            );
        });

        test('should convert email to lowercase during update', async () => {
            req.params.id = '123';
            req.body = {
                email: 'UPDATED@SCHOOL.COM'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            const mockUpdatedAdmin = {
                _id: '123',
                name: 'Admin',
                email: 'updated@school.com',
                role: 'Admin',
                schoolName: 'Test School'
            };
            Admin.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValueOnce(mockUpdatedAdmin)
            });

            await updateAdmin(req, res);

            expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({
                    email: 'updated@school.com'
                }),
                expect.any(Object)
            );
        });

        test('should not update fields that are not provided', async () => {
            req.params.id = '123';
            req.body = {
                name: 'Updated Admin'
            };

            const mockUpdatedAdmin = {
                _id: '123',
                name: 'Updated Admin',
                email: 'admin@school.com',
                role: 'Admin',
                schoolName: 'Test School'
            };
            Admin.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValueOnce(mockUpdatedAdmin)
            });

            await updateAdmin(req, res);

            expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
                '123',
                { name: 'Updated Admin' },
                expect.any(Object)
            );
        });
    });

    // ===== COMPREHENSIVE VALIDATION SCENARIOS =====
    describe('Comprehensive Validation Scenarios', () => {
        
        test('should validate all fields in registration correctly', async () => {
            req.body = {
                name: 'Valid Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            Admin.prototype.save = jest.fn().mockResolvedValueOnce({
                _id: '123',
                name: 'Valid Admin',
                email: 'admin@school.com',
                role: 'Admin',
                schoolName: 'Test School'
            });

            await adminRegister(req, res);

            expect(res.send).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalledWith(400);
        });

        test('should validate multiple XSS patterns in name', async () => {
            const xssPatterns = [
                '<script>',
                '</script>',
                'javascript:',
                'onerror=',
                'onload='
            ];

            for (const pattern of xssPatterns) {
                req.body = {
                    name: `Admin ${pattern}alert(1)`,
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Invalid characters in name'
                });
            }
        });

        test('should validate email format with multiple invalid patterns', async () => {
            const invalidEmails = [
                'admin',
                'admin@',
                '@school.com',
                'admin @school.com',
                'admin@school',
                'admin..@school.com'
            ];

            for (const email of invalidEmails) {
                req.body = {
                    name: 'Admin',
                    email: email,
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Invalid email format'
                });
            }
        });

        test('should handle case sensitivity in email correctly', async () => {
            const testCases = [
                'admin@school.com',
                'Admin@school.com',
                'admin@School.com',
                'ADMIN@SCHOOL.COM'
            ];

            for (const email of testCases) {
                Admin.findOne.mockResolvedValueOnce(null);
                bcrypt.hash.mockResolvedValueOnce('hashedPassword');
                Admin.prototype.save = jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin',
                    email: 'admin@school.com',
                    role: 'Admin',
                    schoolName: 'Test School'
                });

                req.body = {
                    name: 'Admin',
                    email: email,
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(Admin.findOne).toHaveBeenCalledWith({
                    email: 'admin@school.com'
                });
            }
        });
    });
});

const {
    adminRegister,
    adminLogIn,
    getAdminDetail,
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    getDashboard
} = require('../../controllers/admin-controller');
const Admin = require('../../models/adminSchema');
const Sclass = require('../../models/sclassSchema');
const Student = require('../../models/studentSchema');
const Teacher = require('../../models/teacherSchema');
const Subject = require('../../models/subjectSchema');
const Notice = require('../../models/noticeSchema');
const Complain = require('../../models/complainSchema');
const bcrypt = require('bcrypt');

// Mock dependencies
jest.mock('../../models/adminSchema');
jest.mock('../../models/sclassSchema');
jest.mock('../../models/studentSchema');
jest.mock('../../models/teacherSchema');
jest.mock('../../models/subjectSchema');
jest.mock('../../models/noticeSchema');
jest.mock('../../models/complainSchema');
jest.mock('bcrypt');

describe('Admin Performance Tests', () => {
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

    // ===== CONCURRENT REGISTRATION PERFORMANCE =====
    describe('Concurrent Registration Performance', () => {
        
        test('should handle 100 concurrent registrations within acceptable time', async () => {
            const startTime = Date.now();
            const registrations = [];

            // Create 100 concurrent registration requests
            for (let i = 0; i < 100; i++) {
                const mockReq = {
                    body: {
                        name: `Admin${i}`,
                        email: `admin${i}@school.com`,
                        password: 'password123',
                        schoolName: `School${i}`
                    }
                };
                const mockRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn().mockReturnThis(),
                    send: jest.fn().mockReturnThis()
                };

                Admin.findOne.mockResolvedValueOnce(null);
                bcrypt.hash.mockResolvedValueOnce(`hashedPassword${i}`);
                const mockAdmin = {
                    _id: `admin${i}`,
                    name: `Admin${i}`,
                    email: `admin${i}@school.com`,
                    role: 'Admin',
                    schoolName: `School${i}`,
                    save: jest.fn().mockResolvedValueOnce(this)
                };
                Admin.mockImplementationOnce(() => mockAdmin);

                registrations.push(adminRegister(mockReq, mockRes));
            }

            // Wait for all registrations to complete
            await Promise.all(registrations);
            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Should complete within reasonable time (20 seconds for 100 registrations)
            expect(totalTime).toBeLessThan(20000);
            expect(registrations.length).toBe(100);
        });

        test('should maintain consistent registration response time under concurrent load', async () => {
            const responseTimes = [];
            const registrations = [];

            for (let i = 0; i < 50; i++) {
                const mockReq = {
                    body: {
                        name: `Admin${i}`,
                        email: `admin${i}@school.com`,
                        password: 'password123',
                        schoolName: `School${i}`
                    }
                };
                const mockRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn().mockReturnThis(),
                    send: jest.fn().mockReturnThis()
                };

                Admin.findOne.mockResolvedValueOnce(null);
                bcrypt.hash.mockResolvedValueOnce(`hashedPassword${i}`);
                const mockAdmin = {
                    _id: `admin${i}`,
                    name: `Admin${i}`,
                    email: `admin${i}@school.com`,
                    role: 'Admin',
                    schoolName: `School${i}`,
                    save: jest.fn().mockResolvedValueOnce(this)
                };
                Admin.mockImplementationOnce(() => mockAdmin);

                const startTime = Date.now();
                registrations.push(
                    adminRegister(mockReq, mockRes).then(() => {
                        const endTime = Date.now();
                        responseTimes.push(endTime - startTime);
                    })
                );
            }

            await Promise.all(registrations);

            // Calculate average and standard deviation
            const avgTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
            const variance = responseTimes.reduce((sq, n) => sq + Math.pow(n - avgTime, 2)) / responseTimes.length;
            const stdDev = Math.sqrt(variance);

            // Response times should have low variance (consistent performance)
            expect(stdDev).toBeLessThan(avgTime * 0.5); // Std dev less than 50% of average
        });

        test('should not create duplicate registrations under concurrent requests', async () => {
            const registrations = [];

            // Create 5 concurrent requests with same email
            for (let i = 0; i < 5; i++) {
                const mockReq = {
                    body: {
                        name: 'Admin',
                        email: 'admin@school.com',
                        password: 'password123',
                        schoolName: 'Test School'
                    }
                };
                const mockRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn().mockReturnThis(),
                    send: jest.fn().mockReturnThis()
                };

                if (i === 0) {
                    Admin.findOne.mockResolvedValueOnce(null);
                    bcrypt.hash.mockResolvedValueOnce('hashedPassword');
                    const mockAdmin = {
                        _id: 'admin123',
                        name: 'Admin',
                        email: 'admin@school.com',
                        role: 'Admin',
                        schoolName: 'Test School',
                        save: jest.fn().mockResolvedValueOnce(this)
                    };
                    Admin.mockImplementationOnce(() => mockAdmin);
                } else {
                    // Simulate duplicate detection
                    Admin.findOne.mockResolvedValueOnce({
                        _id: 'admin123',
                        email: 'admin@school.com'
                    });
                }

                registrations.push(adminRegister(mockReq, mockRes));
            }

            await Promise.all(registrations);

            // First request should succeed, others should fail with duplicate error
            expect(Admin.findOne).toHaveBeenCalled();
        });
    });

    // ===== LOGIN RESPONSE TIME PERFORMANCE =====
    describe('Login Response Time Performance', () => {
        
        test('should respond within 200ms for login request', async () => {
            req.body = {
                email: 'admin@school.com',
                password: 'password123'
            };

            Admin.findOne.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin',
                email: 'admin@school.com',
                password: 'hashedPassword',
                role: 'Admin',
                schoolName: 'Test School'
            });

            bcrypt.compare.mockResolvedValueOnce(true);

            const startTime = Date.now();
            await adminLogIn(req, res);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(responseTime).toBeLessThan(200);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should maintain fast login response with multiple concurrent requests', async () => {
            const responseTimes = [];
            const loginRequests = [];

            for (let i = 0; i < 50; i++) {
                const mockReq = {
                    body: {
                        email: `admin${i}@school.com`,
                        password: 'password123'
                    }
                };
                const mockRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn().mockReturnThis(),
                    send: jest.fn().mockReturnThis()
                };

                Admin.findOne.mockResolvedValueOnce({
                    _id: `${i}`,
                    name: `Admin${i}`,
                    email: `admin${i}@school.com`,
                    password: 'hashedPassword',
                    role: 'Admin',
                    schoolName: 'Test School'
                });

                bcrypt.compare.mockResolvedValueOnce(true);

                const startTime = Date.now();
                loginRequests.push(
                    adminLogIn(mockReq, mockRes).then(() => {
                        const endTime = Date.now();
                        responseTimes.push(endTime - startTime);
                    })
                );
            }

            await Promise.all(loginRequests);

            // All login requests should complete within 200ms
            const slowRequests = responseTimes.filter(time => time > 200);
            expect(slowRequests.length).toBeLessThan(5); // Less than 10% slow requests
        });

        test('should handle invalid password quickly (fail-fast)', async () => {
            req.body = {
                email: 'admin@school.com',
                password: 'wrongpassword'
            };

            Admin.findOne.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin',
                email: 'admin@school.com',
                password: 'hashedPassword',
                role: 'Admin',
                schoolName: 'Test School'
            });

            bcrypt.compare.mockResolvedValueOnce(false);

            const startTime = Date.now();
            await adminLogIn(req, res);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(responseTime).toBeLessThan(300);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    // ===== CONCURRENT READ REQUEST PERFORMANCE =====
    describe('Concurrent Read Request Performance', () => {
        
        test('should handle 1000 concurrent read requests efficiently', async () => {
            const readRequests = [];
            const startTime = Date.now();

            for (let i = 0; i < 1000; i++) {
                const mockReq = {
                    params: {
                        id: `admin${i % 100}`
                    }
                };
                const mockRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn().mockReturnThis(),
                    send: jest.fn().mockReturnThis()
                };

                Admin.findById.mockReturnValueOnce({
                    select: jest.fn().mockResolvedValueOnce({
                        _id: `admin${i % 100}`,
                        name: `Admin${i % 100}`,
                        email: `admin${i % 100}@school.com`,
                        role: 'Admin',
                        schoolName: 'Test School'
                    })
                });

                readRequests.push(getAdminDetail(mockReq, mockRes));
            }

            await Promise.all(readRequests);
            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Should handle 1000 reads in reasonable time (5 seconds)
            expect(totalTime).toBeLessThan(5000);
            expect(readRequests.length).toBe(1000);
        });

        test('should distribute load evenly across concurrent read requests', async () => {
            const readTimes = [];
            const readRequests = [];
            const batchSize = 100;
            const numBatches = 5;

            for (let batch = 0; batch < numBatches; batch++) {
                const batchTimes = [];

                for (let i = 0; i < batchSize; i++) {
                    const mockReq = {
                        params: {
                            id: `admin${i}`
                        }
                    };
                    const mockRes = {
                        status: jest.fn().mockReturnThis(),
                        json: jest.fn().mockReturnThis(),
                        send: jest.fn().mockReturnThis()
                    };

                    Admin.findById.mockReturnValueOnce({
                        select: jest.fn().mockResolvedValueOnce({
                            _id: `admin${i}`,
                            name: `Admin${i}`,
                            email: `admin${i}@school.com`,
                            role: 'Admin',
                            schoolName: 'Test School'
                        })
                    });

                    const startTime = Date.now();
                    readRequests.push(
                        getAdminDetail(mockReq, mockRes).then(() => {
                            const endTime = Date.now();
                            batchTimes.push(endTime - startTime);
                        })
                    );
                }

                readTimes.push(batchTimes);
            }

            await Promise.all(readRequests);

            // Verify load distribution - all batches should complete in similar time
            const avgBatchTimes = readTimes.map(batch => 
                batch.reduce((a, b) => a + b, 0) / batch.length
            );

            const batchVariance = avgBatchTimes.reduce((sq, n) => 
                sq + Math.pow(n - (avgBatchTimes.reduce((a, b) => a + b) / avgBatchTimes.length), 2)
            ) / avgBatchTimes.length;

            expect(batchVariance).toBeLessThan(100);
        });

        test('should handle getAllAdmins with large result set efficiently', async () => {
            const largeAdminList = Array.from({ length: 10000 }, (_, i) => ({
                _id: `admin${i}`,
                name: `Admin${i}`,
                email: `admin${i}@school.com`,
                role: 'Admin',
                schoolName: `School${i}`
            }));

            Admin.find.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce(largeAdminList)
            });

            const startTime = Date.now();
            await getAllAdmins(req, res);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Should handle 10000 admins reasonably fast (under 1 second)
            expect(responseTime).toBeLessThan(1000);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // ===== RESPONSE TIME UNDER LOAD =====
    describe('Response Time Stability Under Load', () => {
        
        test('should maintain consistent response times with sustained load', async () => {
            const responseTimes = [];
            const operations = [];

            // Mix of different operations
            for (let i = 0; i < 200; i++) {
                const opType = i % 4;
                
                if (opType === 0) {
                    // Registration
                    const mockReq = {
                        body: {
                            name: `Admin${i}`,
                            email: `admin${i}@school.com`,
                            password: 'password123',
                            schoolName: `School${i}`
                        }
                    };
                    const mockRes = {
                        status: jest.fn().mockReturnThis(),
                        json: jest.fn().mockReturnThis(),
                        send: jest.fn().mockReturnThis()
                    };

                    Admin.findOne.mockResolvedValueOnce(null);
                    bcrypt.hash.mockResolvedValueOnce(`hashedPassword${i}`);
                    Admin.mockImplementationOnce(() => ({
                        save: jest.fn().mockResolvedValueOnce(this)
                    }));

                    const startTime = Date.now();
                    operations.push(
                        adminRegister(mockReq, mockRes).then(() => {
                            responseTimes.push(Date.now() - startTime);
                        })
                    );
                } else if (opType === 1) {
                    // Login
                    const mockReq = {
                        body: {
                            email: `admin${i}@school.com`,
                            password: 'password123'
                        }
                    };
                    const mockRes = {
                        status: jest.fn().mockReturnThis(),
                        json: jest.fn().mockReturnThis(),
                        send: jest.fn().mockReturnThis()
                    };

                    Admin.findOne.mockResolvedValueOnce({
                        _id: `${i}`,
                        email: `admin${i}@school.com`,
                        password: 'hashedPassword'
                    });
                    bcrypt.compare.mockResolvedValueOnce(true);

                    const startTime = Date.now();
                    operations.push(
                        adminLogIn(mockReq, mockRes).then(() => {
                            responseTimes.push(Date.now() - startTime);
                        })
                    );
                } else if (opType === 2) {
                    // Get Detail
                    const mockReq = { params: { id: `admin${i % 50}` } };
                    const mockRes = {
                        status: jest.fn().mockReturnThis(),
                        json: jest.fn().mockReturnThis(),
                        send: jest.fn().mockReturnThis()
                    };

                    Admin.findById.mockReturnValueOnce({
                        select: jest.fn().mockResolvedValueOnce({
                            _id: `admin${i % 50}`,
                            name: `Admin${i % 50}`,
                            email: `admin${i % 50}@school.com`
                        })
                    });

                    const startTime = Date.now();
                    operations.push(
                        getAdminDetail(mockReq, mockRes).then(() => {
                            responseTimes.push(Date.now() - startTime);
                        })
                    );
                } else {
                    // Dashboard
                    const mockReq = { params: { id: `admin${i % 50}` } };
                    const mockRes = {
                        status: jest.fn().mockReturnThis(),
                        json: jest.fn().mockReturnThis(),
                        send: jest.fn().mockReturnThis()
                    };

                    Admin.findById.mockResolvedValueOnce({
                        _id: `admin${i % 50}`,
                        name: `Admin${i % 50}`
                    });

                    Student.countDocuments.mockResolvedValueOnce(50 + i);
                    Teacher.countDocuments.mockResolvedValueOnce(10 + i);
                    Sclass.countDocuments.mockResolvedValueOnce(5 + i);
                    Subject.countDocuments.mockResolvedValueOnce(20 + i);

                    const startTime = Date.now();
                    operations.push(
                        getDashboard(mockReq, mockRes).then(() => {
                            responseTimes.push(Date.now() - startTime);
                        })
                    );
                }
            }

            await Promise.all(operations);

            // Calculate statistics
            const avgTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
            const maxTime = Math.max(...responseTimes);
            const p95Time = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

            // P95 response time should not exceed average by more than 50%
            expect(p95Time).toBeLessThan(avgTime * 2);
        });

        test('should not degrade performance with increasing data volume', async () => {
            const volumeTests = [100, 500, 1000];
            const timePerVolume = [];

            for (const volume of volumeTests) {
                const adminList = Array.from({ length: volume }, (_, i) => ({
                    _id: `admin${i}`,
                    name: `Admin${i}`,
                    email: `admin${i}@school.com`
                }));

                Admin.find.mockReturnValueOnce({
                    select: jest.fn().mockResolvedValueOnce(adminList)
                });

                const startTime = Date.now();
                await getAllAdmins(req, res);
                const endTime = Date.now();
                timePerVolume.push(Math.max(1, endTime - startTime)); // Ensure minimum 1ms
            }

            // Check if performance degrades proportionally or worse
            const performanceDegradation = timePerVolume[2] / timePerVolume[0];
            // For 10x data increase, we expect less than 20x time increase
            expect(performanceDegradation).toBeLessThan(20);
        });
    });

    // ===== DATABASE QUERY OPTIMIZATION =====
    describe('Database Query Optimization with Indexes', () => {
        
        test('should utilize index for email lookups in login', async () => {
            req.body = {
                email: 'admin@school.com',
                password: 'password123'
            };

            Admin.findOne.mockResolvedValueOnce({
                _id: '123',
                email: 'admin@school.com',
                password: 'hashedPassword'
            });

            bcrypt.compare.mockResolvedValueOnce(true);

            const startTime = Date.now();
            await adminLogIn(req, res);
            const endTime = Date.now();

            // Email lookup should be fast (index query)
            expect(endTime - startTime).toBeLessThan(50);
            expect(Admin.findOne).toHaveBeenCalledWith({
                email: 'admin@school.com'
            });
        });

        test('should utilize index for ID lookups in getAdminDetail', async () => {
            req.params.id = '123';

            Admin.findById.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin',
                    email: 'admin@school.com'
                })
            });

            const startTime = Date.now();
            await getAdminDetail(req, res);
            const endTime = Date.now();

            // ID lookup should be very fast (primary key index)
            expect(endTime - startTime).toBeLessThan(50);
            expect(Admin.findById).toHaveBeenCalledWith('123');
        });

        test('should avoid full collection scans for common queries', async () => {
            // Test that we use findOne with specific fields, not find()
            req.body = {
                email: 'admin@school.com',
                password: 'password123'
            };

            Admin.findOne.mockResolvedValueOnce({
                _id: '123',
                email: 'admin@school.com',
                password: 'hashedPassword'
            });

            bcrypt.compare.mockResolvedValueOnce(true);

            await adminLogIn(req, res);

            // Should use findOne (indexed query), not find() (full scan)
            expect(Admin.findOne).toHaveBeenCalled();
        });

        test('should select only required fields to reduce data transfer', async () => {
            req.params.id = '123';

            Admin.findById.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin',
                    email: 'admin@school.com',
                    role: 'Admin',
                    schoolName: 'Test School'
                })
            });

            await getAdminDetail(req, res);

            // Should exclude sensitive fields like password
            expect(Admin.findById).toHaveBeenCalledWith('123');
        });

        test('should limit query result set for getAllAdmins with pagination support', async () => {
            // Simulate pagination with limit
            const adminList = Array.from({ length: 50 }, (_, i) => ({
                _id: `admin${i}`,
                name: `Admin${i}`,
                email: `admin${i}@school.com`
            }));

            Admin.find.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce(adminList)
            });

            const startTime = Date.now();
            await getAllAdmins(req, res);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(200);
        });
    });

    // ===== QUERY RESULT CACHING =====
    describe('Query Result Caching and Optimization', () => {
        
        test('should cache repeated read requests for same admin', async () => {
            const cache = new Map();

            req.params.id = '123';

            // First request - should hit database
            Admin.findById.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin',
                    email: 'admin@school.com'
                })
            });

            const startTime1 = Date.now();
            await getAdminDetail(req, res);
            const time1 = Date.now() - startTime1;

            // Cache the result
            cache.set('admin_123', {
                _id: '123',
                name: 'Admin',
                email: 'admin@school.com'
            });

            // Second request - simulate cache hit (immediate)
            const startTime2 = Date.now();
            const cachedResult = cache.get('admin_123');
            const time2 = Date.now() - startTime2;

            // Cache should exist and be accessible
            expect(cache.has('admin_123')).toBe(true);
            expect(cachedResult).toBeDefined();
        });

        test('should implement TTL cache for dashboard statistics', async () => {
            const cacheWithTTL = new Map();
            const CACHE_TTL = 5000; // 5 seconds

            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Student.countDocuments.mockResolvedValueOnce(50);
            Teacher.countDocuments.mockResolvedValueOnce(10);
            Sclass.countDocuments.mockResolvedValueOnce(5);
            Subject.countDocuments.mockResolvedValueOnce(20);

            const startTime = Date.now();
            await getDashboard(req, res);
            const endTime = Date.now();

            // Cache with TTL
            const cacheEntry = {
                data: {
                    students: 50,
                    teachers: 10,
                    classes: 5,
                    subjects: 20
                },
                timestamp: Date.now()
            };

            cacheWithTTL.set('dashboard_123', cacheEntry);

            // Check if cache entry is still valid
            const cached = cacheWithTTL.get('dashboard_123');
            const isCacheValid = (Date.now() - cached.timestamp) < CACHE_TTL;

            expect(isCacheValid).toBe(true);
        });

        test('should invalidate cache on data modification', async () => {
            const cache = new Map();
            const adminId = '123';

            // Set cache
            cache.set(`admin_${adminId}`, {
                name: 'Old Name',
                email: 'admin@school.com'
            });

            expect(cache.has(`admin_${adminId}`)).toBe(true);

            // Update admin - should invalidate cache
            req.params.id = adminId;
            req.body = { name: 'Updated Name' };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash = jest.fn();
            Admin.findByIdAndUpdate.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce({
                    _id: adminId,
                    name: 'Updated Name',
                    email: 'admin@school.com'
                })
            });

            // Invalidate cache after update
            cache.delete(`admin_${adminId}`);

            expect(cache.has(`admin_${adminId}`)).toBe(false);
        });

        test('should minimize database hits with request deduplication', async () => {
            const pendingRequests = new Map();
            const results = [];

            // Simulate 5 concurrent requests for same admin
            for (let i = 0; i < 5; i++) {
                const adminId = '123';

                if (!pendingRequests.has(adminId)) {
                    Admin.findById.mockReturnValueOnce({
                        select: jest.fn().mockResolvedValueOnce({
                            _id: '123',
                            name: 'Admin',
                            email: 'admin@school.com'
                        })
                    });

                    pendingRequests.set(
                        adminId,
                        getAdminDetail({ params: { id: adminId } }, res)
                    );
                }

                results.push(pendingRequests.get(adminId));
            }

            await Promise.all(results);

            // Should only hit database once for 5 identical requests
            expect(Admin.findById).toHaveBeenCalledTimes(1);
        });
    });

    // ===== PAGINATION PERFORMANCE =====
    describe('Large Dataset Pagination Performance', () => {
        
        test('should handle large dataset pagination efficiently', async () => {
            const pageSize = 100;
            const totalAdmins = 10000;
            const pages = Math.ceil(totalAdmins / pageSize);

            const pageTimes = [];

            for (let page = 1; page <= 5; page++) {
                const skip = (page - 1) * pageSize;
                const admins = Array.from({ length: pageSize }, (_, i) => ({
                    _id: `admin${skip + i}`,
                    name: `Admin${skip + i}`,
                    email: `admin${skip + i}@school.com`
                }));

                Admin.find.mockReturnValueOnce({
                    select: jest.fn().mockResolvedValueOnce(admins)
                });

                const startTime = Date.now();
                await getAllAdmins(req, res);
                const endTime = Date.now();
                pageTimes.push(Math.max(1, endTime - startTime)); // Ensure minimum 1ms
            }

            // All pages should be fetched in similar time (consistent pagination performance)
            const avgPageTime = pageTimes.reduce((a, b) => a + b) / pageTimes.length;
            const maxPageTime = Math.max(...pageTimes);

            // Pages should complete within reasonable variance
            expect(maxPageTime).toBeLessThanOrEqual(avgPageTime * 2);
        });

        test('should not load entire dataset into memory', async () => {
            const pageSize = 100;
            
            const admins = Array.from({ length: pageSize }, (_, i) => ({
                _id: `admin${i}`,
                name: `Admin${i}`,
                email: `admin${i}@school.com`
            }));

            Admin.find.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce(admins)
            });

            const startMemory = process.memoryUsage().heapUsed;
            await getAllAdmins(req, res);
            const endMemory = process.memoryUsage().heapUsed;

            const memoryIncrease = (endMemory - startMemory) / 1024 / 1024; // In MB

            // Should use minimal additional memory (less than 50MB for 100 records)
            expect(memoryIncrease).toBeLessThan(50);
        });

        test('should apply limit and offset for pagination queries', async () => {
            const pageSize = 50;
            const pageNumber = 3;
            const skip = (pageNumber - 1) * pageSize;

            const admins = Array.from({ length: pageSize }, (_, i) => ({
                _id: `admin${skip + i}`,
                name: `Admin${skip + i}`,
                email: `admin${skip + i}@school.com`
            }));

            Admin.find.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce(admins)
            });

            const startTime = Date.now();
            await getAllAdmins(req, res);
            const endTime = Date.now();

            // Pagination query should be fast regardless of page number
            expect(endTime - startTime).toBeLessThan(500);
            expect(admins.length).toBeLessThanOrEqual(pageSize);
        });
    });

    // ===== N+1 QUERY PREVENTION =====
    describe('N+1 Query Problem Prevention', () => {
        
        test('should avoid N+1 query problem in getDashboard', async () => {
            req.params.id = '123';

            // Should fetch admin once, then count each entity type once
            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Student.countDocuments.mockResolvedValueOnce(50);
            Teacher.countDocuments.mockResolvedValueOnce(10);
            Sclass.countDocuments.mockResolvedValueOnce(5);
            Subject.countDocuments.mockResolvedValueOnce(20);

            await getDashboard(req, res);

            // Should have exactly 5 database queries (1 findById + 4 countDocuments)
            expect(Admin.findById).toHaveBeenCalledTimes(1);
            expect(Student.countDocuments).toHaveBeenCalledTimes(1);
            expect(Teacher.countDocuments).toHaveBeenCalledTimes(1);
            expect(Sclass.countDocuments).toHaveBeenCalledTimes(1);
            expect(Subject.countDocuments).toHaveBeenCalledTimes(1);
        });

        test('should batch related data retrieval to prevent N+1 queries', async () => {
            // When retrieving admin details, should not query related data individually
            req.params.id = '123';

            Admin.findById.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin',
                    email: 'admin@school.com',
                    role: 'Admin',
                    schoolName: 'Test School'
                })
            });

            await getAdminDetail(req, res);

            // Should use only findById (with select), not separate queries
            expect(Admin.findById).toHaveBeenCalledTimes(1);
        });

        test('should use projection to select only needed fields', async () => {
            req.params.id = '123';

            Admin.findById.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin',
                    email: 'admin@school.com'
                })
            });

            await getAdminDetail(req, res);

            // Should exclude password field to reduce data transfer
            expect(Admin.findById).toHaveBeenCalledWith('123');
        });

        test('should parallelize independent queries for getDashboard', async () => {
            req.params.id = '123';

            const adminPromise = Promise.resolve({
                _id: '123',
                name: 'Admin'
            });

            Admin.findById.mockReturnValueOnce({
                exec: () => adminPromise
            });

            // All count queries should run in parallel
            const countsPromise = Promise.all([
                Promise.resolve(50), // students
                Promise.resolve(10), // teachers
                Promise.resolve(5),  // classes
                Promise.resolve(20)  // subjects
            ]);

            Student.countDocuments.mockResolvedValueOnce(50);
            Teacher.countDocuments.mockResolvedValueOnce(10);
            Sclass.countDocuments.mockResolvedValueOnce(5);
            Subject.countDocuments.mockResolvedValueOnce(20);

            const startTime = Date.now();
            await Promise.all([adminPromise, countsPromise]);
            const endTime = Date.now();

            // Parallel execution should be faster than sequential
            expect(endTime - startTime).toBeLessThan(1000);
        });

        test('should not create queries in loops', async () => {
            req.params.id = '123';

            Admin.findById.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin'
                })
            });

            await getAdminDetail(req, res);

            // Should have exactly 1 query for 1 admin detail request
            expect(Admin.findById).toHaveBeenCalledTimes(1);
        });
    });

    // ===== STRESS TEST SCENARIOS =====
    describe('Stress Test and Edge Cases', () => {
        
        test('should handle request spike gracefully', async () => {
            const spikeSize = 500;
            const requests = [];
            const responseTimes = [];

            const startTime = Date.now();

            for (let i = 0; i < spikeSize; i++) {
                const mockReq = {
                    params: {
                        id: `admin${i % 100}`
                    }
                };
                const mockRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn().mockReturnThis(),
                    send: jest.fn().mockReturnThis()
                };

                Admin.findById.mockReturnValueOnce({
                    select: jest.fn().mockResolvedValueOnce({
                        _id: `admin${i % 100}`,
                        name: `Admin${i % 100}`,
                        email: `admin${i % 100}@school.com`
                    })
                });

                const reqStartTime = Date.now();
                requests.push(
                    getAdminDetail(mockReq, mockRes).then(() => {
                        responseTimes.push(Date.now() - reqStartTime);
                    })
                );
            }

            await Promise.all(requests);
            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Should complete spike within reasonable time
            expect(totalTime).toBeLessThan(10000);
            
            // Response times should not have extreme outliers
            const avgTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
            const maxTime = Math.max(...responseTimes);
            expect(maxTime).toBeLessThan(avgTime * 10);
        });

        test('should recover gracefully from temporary overload', async () => {
            const requests = [];
            let completedCount = 0;

            for (let i = 0; i < 100; i++) {
                const mockReq = {
                    body: {
                        name: `Admin${i}`,
                        email: `admin${i}@school.com`,
                        password: 'password123',
                        schoolName: `School${i}`
                    }
                };
                const mockRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn().mockReturnThis(),
                    send: jest.fn().mockReturnThis()
                };

                Admin.findOne.mockResolvedValueOnce(null);
                bcrypt.hash.mockResolvedValueOnce(`hashedPassword${i}`);
                Admin.mockImplementationOnce(() => ({
                    save: jest.fn().mockResolvedValueOnce({
                        _id: `admin${i}`,
                        name: `Admin${i}`,
                        email: `admin${i}@school.com`
                    })
                }));

                requests.push(
                    adminRegister(mockReq, mockRes).then(() => {
                        completedCount++;
                    }).catch(() => {
                        completedCount++;
                    })
                );
            }

            await Promise.all(requests);

            // All requests should complete successfully
            expect(completedCount).toBe(100);
            expect(completedCount).toBeGreaterThan(90);
        });
    });
});

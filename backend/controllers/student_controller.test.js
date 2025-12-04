const studentController = require('./student_controller');

describe('Student Controller', () => {
	test('should create a student', () => {
		const req = { body: { name: 'John Doe', age: 20 } };
		const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		studentController.createStudent(req, res);
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'John Doe' }));
	});

	test('should get a student by ID', () => {
		const req = { params: { id: '1' } };
		const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		studentController.getStudent(req, res);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
	});

	test('should update a student', () => {
		const req = { params: { id: '1' }, body: { name: 'Jane Doe' } };
		const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		studentController.updateStudent(req, res);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane Doe' }));
	});

	test('should delete a student', () => {
		const req = { params: { id: '1' } };
		const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		studentController.deleteStudent(req, res);
		expect(res.status).toHaveBeenCalledWith(204);
		expect(res.json).not.toHaveBeenCalled();
	});
});
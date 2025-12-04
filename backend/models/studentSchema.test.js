const { validateStudentSchema } = require('./studentSchema');
const { Schema } = require('mongoose');

test('studentSchema should have required fields', () => {
	const student = new Schema({
		name: { type: String, required: true },
		age: { type: Number, required: true },
		email: { type: String, required: true }
	});
	expect(validateStudentSchema(student)).toBe(true);
});

test('studentSchema should not allow invalid email', () => {
	const student = new Schema({
		name: 'John Doe',
		age: 20,
		email: 'invalid-email'
	});
	expect(validateStudentSchema(student)).toBe(false);
});
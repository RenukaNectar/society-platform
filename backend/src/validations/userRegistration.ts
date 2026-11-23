import { body } from "express-validator";
import { findUserByEmail, findUserByPhoneNumber } from "../services/UserService";

export const validateUserRegistration = async (body: any) => {
    if(!body.email) {
        return 'Email is required';
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return 'Invalid email';
    }
    if(!body.password) {
        return 'Password is required';
    }
    if(body.password.length < 6) {
        return 'Password must be at least 6 characters';
    }
    if(!body.confirm_password) {
        return 'Confirm password is required';
    }
    if(!body.first_name) {
        return 'First name is required';
    }
    if(body.first_name.length < 3) {
        return 'First name must be at least 3 characters';
    }
    if(!body.last_name) {
        return 'Last name is required';
    }
    if(body.last_name.length < 3) {
        return 'Last name must be at least 3 characters';
    }
    if(!body.phone) {
        return 'Phone number is required';
    }
    if(body.phone) {
        if(!/^[6-9]\d{9}$/.test(body.phone)) {
            return 'Invalid phone number';
        }
    }
    if(body.password !== body.confirm_password) {
        return 'Password and confirm password do not match';
    }
    const existingUserEmail = await findUserByEmail(body.email);
    if (existingUserEmail) {
        return 'User with this email already exists';
    }

    if (body.phone) {
      const existingUserPhone = await findUserByPhoneNumber(body.phone);
      if (existingUserPhone) {
        return 'User with this phone number already exists';
      }
    }
    return null;
};

export const registerValidation = [
    body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('phone').optional().isMobilePhone('en-IN').withMessage('Valid phone number is required'),
    body('confirm_password').notEmpty().withMessage('Confirm password is required')
  ];
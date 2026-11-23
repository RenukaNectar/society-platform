import { body } from "express-validator";

export const loginValidation = [
    body('email').notEmpty().withMessage('Email or mobile number is required'),
    body('password').notEmpty().withMessage('Password is required')
];

export const sendOTPValidation = [
    body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required')
];

export const verifyOTPValidation = [
    body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required'),
    body('otp').isLength({ min: 4, max: 4 }).isNumeric().withMessage('OTP must be 4 digits'),
    body('flow').optional().isIn(['login', 'password_reset', 'email_verification']).withMessage('Flow must be login, password_reset or email_verification')
];

export const resetPasswordValidation = [
    body('reset_token').notEmpty().isString().withMessage('Valid reset token is required'),
    body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirm_password').notEmpty().withMessage('Confirm password is required'),
    body('confirm_password').custom((value, { req }) => {
        if (value !== req.body.new_password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }).withMessage('Passwords do not match')
];

export const validateUserRegistration = [
    body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirm_password').notEmpty().withMessage('Confirm password is required'),
    body('confirm_password').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }).withMessage('Passwords do not match'),
    body('first_name').isLength({ min: 3 }).withMessage('First name must be at least 3 characters'),
    body('last_name').isLength({ min: 3 }).withMessage('Last name must be at least 3 characters'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number format')
];

export const registerValidation = [
    body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('phone').optional().isMobilePhone('en-IN').withMessage('Valid phone number is required'),
    body('confirm_password').notEmpty().withMessage('Confirm password is required')
];

export const refreshTokenValidation = [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')

];

export const changePasswordValidation = [
    body('current_password').notEmpty().withMessage('Old password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirm_password').notEmpty().withMessage('Confirm password is required'),
    body('confirm_password').custom((value, { req }) => {
        if (value !== req.body.new_password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }).withMessage('Passwords do not match')
];
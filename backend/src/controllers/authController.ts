import { ILoginRequest, IRegisterRequest, IAuthRequest } from "../types";
import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import { findRoleByIdOrName, findRoleById } from "../services/RoleService";
import { createUser, findUserByEmailForLogin, updateFailedLoginAttempts, findUserById, sanitizeUserData, generateOTP, setOTP, verifyOTP, findUserByEmailWithOTP, updateUserPassword, findUserByEmail, findUserByPhoneNumber, findUserByIdWithPassword, checkAndUnlockAccount, setResetToken, findUserByResetToken, clearResetToken, markUserEmailVerified, isUserOtpLocked, registerFailedOtpAttempt, resetFailedOtpAttempts, MAX_OTP_ATTEMPTS } from "../services/UserService";
import { resetFailedLoginAttempts } from "../services/UserService";
import { updateLastLogin } from "../services/UserService";
import { clearOTP } from "../services/UserService";
import jwt from "jsonwebtoken";
import { getSocietyByUserId, getSocietyDetailsById } from "../services/SocietyRegistrationService";
import { returnResponse } from "../utils/response";
import { Request, Response } from "express";
import IUser from "../models/user";
import { createActivity } from "../services/ActiviesService";
import { trySendOTPEmail, sendWelcomeEmail, testEmailConfiguration } from "../utils/email";
import { getAllowedRoutesForRole } from "../utils/rolePermissionRoutes";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

async function getAllowedRoutesForUser(roleId: string) {
  const role = await findRoleById(roleId);
  const permissions = (role as { permissions?: Array<{ name: string }> } | null)?.permissions ?? [];
  const roleName = role?.name ?? '';
  return getAllowedRoutesForRole(roleName, permissions);
}

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { email, password, first_name, last_name, phone, confirm_password }: IRegisterRequest = req.body as IRegisterRequest;

        if (password !== confirm_password) {
            throw new AppError('Password and confirm password do not match', 400);
        }

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            throw new AppError('User with this email already exists', 400);
        }

        if (phone) {
            const existingUserPhone = await findUserByPhoneNumber(phone);
            if (existingUserPhone) {
                throw new AppError('User with this phone number already exists', 400);
            }
        }

        const role = await findRoleByIdOrName('applicant');

        if (!role) {
            throw new AppError('Role not found', 404);
        }

        const isEmailVerificationEnabled = process.env.EMAIL_VERIFICATION === 'true';
        const newUser = await createUser({
            email,
            password,
            first_name,
            last_name,
            phone,
            role_id: role.id,
            is_email_verified: !isEmailVerificationEnabled
        });

        if (isEmailVerificationEnabled) {
            const otp = generateOTP();
            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
            const hashedOTP = await bcrypt.hash(otp, 12);
            await setOTP(newUser.id, hashedOTP, otpExpiry);
            const emailSent = await trySendOTPEmail(newUser.email, otp, newUser.first_name);

            returnResponse(res).ok(
                emailSent
                    ? 'Registration successful. Please verify your email with OTP before login.'
                    : 'Registration successful. Verification email could not be sent. Please verify using OTP (resend if needed) before login.',
                {
                    user: sanitizeUserData(newUser),
                    token: null,
                    isOtpRequired: true,
                    verificationFlow: 'email_verification',
                    emailSent
                }
            );
            return;
        }

        const token = jwt.sign(
            {
                userId: newUser.id,
                email: newUser.email,
                role: newUser.role?.id,
                tokenVersion: newUser.token_version || 0
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        void sendWelcomeEmail(newUser.email, newUser.first_name).catch((err) => {
            logger.error('Welcome email failed after registration:', err);
        });
        returnResponse(res).ok('User registered successfully', {
            user: sanitizeUserData(newUser),
            token
        });
    } catch (error) {
        logger.error('Registration failed:', error);
        if (error instanceof AppError) {
            return returnResponse(res).error(error.message, null);
        }
        return returnResponse(res).error('Registration failed', null);
    }
}

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password }: ILoginRequest = req.body as ILoginRequest;

        const user = await findUserByEmailForLogin(email);

        if (!user) {
            throw new Error('Invalid credentials');
        }
        if (user.is_active === false) {
            returnResponse(res).error('Account is deactivated please contact admin', null);
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 400);
        }

        // Check auth-related runtime flags from env
        logger.info('EMAIL_VERIFICATION', process.env.EMAIL_VERIFICATION);
        logger.info('LOGIN_OTP_REQUIRED', process.env.LOGIN_OTP_REQUIRED);
        const isEmailVerificationEnabled = process.env.EMAIL_VERIFICATION === 'true';
        const isLoginOtpRequired = process.env.LOGIN_OTP_REQUIRED === 'true';

        if (isEmailVerificationEnabled && !user.is_email_verified) {
            const otp = generateOTP();
            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
            const hashedOTP = await bcrypt.hash(otp, 12);
            await setOTP(user.id, hashedOTP, otpExpiry);
            const emailSent = await trySendOTPEmail(user.email, otp, user.first_name);

            returnResponse(res).error(
                emailSent
                    ? 'Email not verified. OTP sent for verification.'
                    : 'Email not verified. Verification email could not be sent. Please verify using OTP (resend if needed).',
                {
                    isOtpRequired: true,
                    verificationFlow: 'email_verification',
                    emailSent
                }
            );
            return;
        }

        if (!isLoginOtpRequired) {
            // Default login flow (OTP on login disabled unless explicitly enabled)
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    district_id: user.district_id,
                    state_id: user.state_id,
                    role: user.role?.name,
                    role_id: user.role_id,
                    name: user.first_name + ' ' + user.last_name,
                    tokenVersion: user.token_version || 0
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            const refreshToken = jwt.sign(
                { userId: user.id, email: user.email, tokenVersion: user.token_version || 0 },
                process.env.JWT_REFRESH_SECRET || 'refresh-secret',
                { expiresIn: '7d' }
            );

            // Get user's society if it exists
            user.society = null;
            try {
                const userWithSociety = await getSocietyByUserId(user.id);
                if (userWithSociety) {
                    const society = await getSocietyDetailsById(userWithSociety?.id);
                    user.society = { ...society?.society, members: society?.members };
                }
            } catch (error) {
                logger.warn('Could not fetch society data for user:', user.id, error);
            }
            const sanitizedUser = sanitizeUserData(user);
            const allowedRoutes = await getAllowedRoutesForUser(user.role_id);

            returnResponse(res).ok('Login successful', {
                user: sanitizedUser,
                token,
                tokenExpiry: '24h',
                refreshToken,
                refreshTokenExpiry: '7d',
                isOtpRequired: false,
                allowedRoutes
            });
            return;
        }

        // Optional OTP-on-login flow (enabled only if LOGIN_OTP_REQUIRED=true)
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        const hashedOTP = await bcrypt.hash(otp, 12);
        await setOTP(user.id, hashedOTP, otpExpiry);
        const emailSent = await trySendOTPEmail(user.email, otp, user.first_name);

        returnResponse(res).ok(
            emailSent
                ? 'Verification required. OTP sent to your email.'
                : 'Verification required. OTP email could not be sent. Please use OTP / resend OTP.',
            {
                user: null,
                token: null,
                isOtpRequired: true,
                emailSent
            }
        );
    } catch (error) {
        logger.error('Login failed:', error);
        if (error instanceof AppError) {
            return returnResponse(res).error(error.message, null);
        }
        const message = error instanceof Error ? error.message : 'Login failed';
        return returnResponse(res).error(message === 'Invalid credentials' ? 'Invalid credentials' : 'Login failed', null);
    }
}


// Refresh Token
export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body as { refreshToken: string };
        if (!refreshToken) throw new AppError("Refresh token required", 400);

        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || "refresh-secret"
        ) as { userId: string; email: string; tokenVersion?: number };

        const user = await findUserByIdWithPassword(decoded.userId);
        if (!user || !user.is_active) {
            throw new AppError("Invalid or expired refresh token", 401);
        }

        const refreshTokenVersion = decoded.tokenVersion ?? 0;
        if (user.token_version !== refreshTokenVersion) {
            throw new AppError("Session expired. Please login again.", 401);
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            { userId: decoded.userId, email: decoded.email, tokenVersion: user.token_version || 0 },
            process.env.JWT_SECRET || "access-secret",
            { expiresIn: "24h" }
        );

        returnResponse(res).ok("Token refreshed successfully", {
            accessToken: newAccessToken,
            accessTokenExpiry: '24h',
            refreshToken: refreshToken,
            refreshTokenExpiry: '7d'
        });
    } catch (error) {
        logger.error("Token refresh failed:", error);
        throw new AppError("Invalid or expired refresh token", 401);
    }
};


export const getProfile = async (req: IAuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new AppError('User not found', 404);
        }

        const user = await findUserById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const userWithSociety = await getSocietyByUserId(user.id);
        user.society = userWithSociety;

        const sanitizedUser = sanitizeUserData(user);

        returnResponse(res).ok('Profile retrieved successfully', {
            user: sanitizedUser
        });
    } catch (error) {
        logger.error('Profile retrieval failed:', error);
        return returnResponse(res).error('Profile retrieval failed', null);
    }
};

// Formats a user-friendly message describing how many minutes remain on an OTP lockout.
const buildOtpLockMessage = (lockedUntil: Date): string => {
    const remainingMs = lockedUntil.getTime() - Date.now();
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
    return `Too many incorrect OTP attempts. Your account is locked. Please try again after ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`;
};

export const sendOTP = async (req: Request, res: Response) => {
    try {
        const { email } = req.body as { email: string };

        const user = await findUserByEmailWithOTP(email);
        logger.info('user', user);
        if (user) {
            const lockStatus = await isUserOtpLocked(user.id);
            if (lockStatus.locked && lockStatus.lockedUntil) {
                returnResponse(res).error(buildOtpLockMessage(lockStatus.lockedUntil), {
                    isOtpLocked: true,
                    lockedUntil: lockStatus.lockedUntil
                });
                return;
            }

            const otp = generateOTP();
            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            const hashedOTP = await bcrypt.hash(otp, 12);

            await setOTP(user.id, hashedOTP, otpExpiry);
            const emailSent = await trySendOTPEmail(user.email, otp, user.first_name);
            returnResponse(res).ok(
                emailSent
                    ? 'If an account with that email exists, an OTP has been sent'
                    : 'OTP generated. Email could not be sent; use verify-otp with the current OTP or try again later.',
                { emailSent }
            );
            return;
        } else {
            throw new AppError('User not found', 404);
        }
    } catch (error) {
        logger.error('Send OTP failed:', error);
        if (error instanceof AppError) {
            return returnResponse(res).error(error.message, null);
        }
        return returnResponse(res).error('Send OTP failed', null);
    }
};

export const verifyOTPController = async (req: Request, res: Response) => {
    try {
        const { email, otp, flow = 'login' } = req.body as { email: string, otp: string, flow?: 'login' | 'password_reset' | 'email_verification' };

        const user = await findUserByEmailWithOTP(email);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Reject the request up-front if the account is currently in an OTP lockout window.
        const lockStatus = await isUserOtpLocked(user.id);
        if (lockStatus.locked && lockStatus.lockedUntil) {
            returnResponse(res).error(buildOtpLockMessage(lockStatus.lockedUntil), {
                isOtpLocked: true,
                lockedUntil: lockStatus.lockedUntil
            });
            return;
        }

        const isValidOTP = await verifyOTP(email, otp);
        if (!isValidOTP) {
            // Count this as a failed attempt and lock the account if the threshold is reached.
            const attemptState = await registerFailedOtpAttempt(user.id);
            if (attemptState.locked && attemptState.lockedUntil) {
                returnResponse(res).error(buildOtpLockMessage(attemptState.lockedUntil), {
                    isOtpLocked: true,
                    lockedUntil: attemptState.lockedUntil
                });
                return;
            }
            returnResponse(res).error(
                `Invalid or expired OTP. ${attemptState.remaining} attempt${attemptState.remaining === 1 ? '' : 's'} remaining before your account is locked.`,
                {
                    attemptsRemaining: attemptState.remaining,
                    maxAttempts: MAX_OTP_ATTEMPTS
                }
            );
            return;
        }

        // OTP is valid - clear any previous failed-attempt counter.
        await resetFailedOtpAttempts(user.id);

        if (flow === 'email_verification') {
            await markUserEmailVerified(user.id);
            returnResponse(res).ok('Email verified successfully. You can now login.', {
                isEmailVerified: true
            });
            return;
        }

        if (flow === 'password_reset') {
            const resetToken = randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            await setResetToken(user.id, resetToken, resetTokenExpiry);

            returnResponse(res).ok('OTP verified successfully', {
                reset_token: resetToken,
                resetToken,
                resetTokenExpiry: '2m'
            });
            return;
        }

        // Generate JWT tokens and return user info after successful OTP verification
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                district_id: user.district_id,
                state_id: user.state_id,
                role: user.role?.name,
                role_id: user.role_id,
                name: user.first_name + ' ' + user.last_name,
                tokenVersion: user.token_version || 0
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        const refreshToken = jwt.sign(
            { userId: user.id, email: user.email, tokenVersion: user.token_version || 0 },
            process.env.JWT_REFRESH_SECRET || 'refresh-secret',
            { expiresIn: '7d' }
        );

        // Get user's society if it exists
        user.society = null;
        try {
            const userWithSociety = await getSocietyByUserId(user.id);
            if (userWithSociety) {
                const society = await getSocietyDetailsById(userWithSociety?.id);
                user.society = { ...society?.society, members: society?.members };
            }
        } catch (error) {
            logger.warn('Could not fetch society data for user:', user.id, error);
        }
        const sanitizedUser = sanitizeUserData(user);
        const allowedRoutes = await getAllowedRoutesForUser(user.role_id);

        returnResponse(res).ok('OTP verified successfully', {
            user: sanitizedUser,
            token,
            tokenExpiry: '24h',
            refreshToken,
            refreshTokenExpiry: '7d',
            isOtpRequired: false,
            allowedRoutes
        });
    } catch (error) {
        logger.error('OTP verification failed:', error);
        return returnResponse(res).error('OTP verification failed', null);
    }
};

export const resetPassword = async (req: IAuthRequest, res: Response) => {
    try {
        const { reset_token, new_password } = req.body as { reset_token: string, new_password: string };

        const user = await findUserByResetToken(reset_token);
        if (!user) {
            throw new AppError('Invalid or expired reset token', 400);
        }

        await updateUserPassword(user.id, new_password, user.id);
        await clearResetToken(user.id);

        returnResponse(res).ok('Password reset successfully', null);
    } catch (error) {
        logger.error('Password reset failed:', error);
        return returnResponse(res).error('Password reset failed', null);
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        returnResponse(res).ok('Logged out successfully', null);
    } catch (error) {
        logger.error('Logout failed:', error);
        return returnResponse(res).error('Logout failed', null);
    }
};

export const changePassword = async (req: IAuthRequest, res: Response) => {
    try {

        const { current_password, new_password, confirm_password } = req.body as { current_password: string, new_password: string, confirm_password: string };

        if (!current_password || !new_password || !confirm_password || new_password.length < 6 || new_password.length > 100) {
            throw new AppError('All password fields are required', 400);
        }

        if (current_password === new_password) {
            throw new AppError('New password cannot be the same as the current password', 400);
        }

        if (new_password !== confirm_password) {
            throw new AppError('New password and confirm password do not match', 400);
        }

        const userId = req.user?.userId as string;
        logger.info('userId', userId);

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        // Get user with password for validation (we need a different function that includes password)
        const user = await findUserByIdWithPassword(userId);

        logger.info('user', user);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const isPasswordValid = await bcrypt.compare(current_password, user.password as string);
        if (!isPasswordValid) {
            throw new AppError('Invalid current password', 400);
        }

        await updateUserPassword(user.id, new_password, req.user?.userId) as any;

        const updatedUser = await findUserById(user.id);
        if (!updatedUser) {
            throw new AppError('User not found', 404);
        }

        const tokenVersion = (updatedUser as { token_version?: number }).token_version ?? 0;
        const token = jwt.sign(
            {
                userId: updatedUser.id,
                email: updatedUser.email,
                district_id: updatedUser.district_id,
                state_id: updatedUser.state_id,
                role: updatedUser.role?.name,
                role_id: updatedUser.role_id,
                name: `${updatedUser.first_name} ${updatedUser.last_name}`,
                tokenVersion
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        const refreshToken = jwt.sign(
            { userId: updatedUser.id, email: updatedUser.email, tokenVersion },
            process.env.JWT_REFRESH_SECRET || 'refresh-secret',
            { expiresIn: '7d' }
        );

        return returnResponse(res).ok('Password changed successfully', {
            token,
            tokenExpiry: '24h',
            refreshToken,
            refreshTokenExpiry: '7d'
        });
    } catch (error: any) {
        logger.error('Change password failed:', error);
        return returnResponse(res).error('Change password failed', null);
    }
};

// Test email configuration
export const testEmailConfig = async (req: Request, res: Response) => {
    try {
        const isValid = await testEmailConfiguration();

        if (isValid) {
            returnResponse(res).ok('Email configuration is valid and working', {
                status: 'success',
                message: 'Email service is properly configured'
            });
        } else {
            returnResponse(res).error('Email configuration is invalid', {
                status: 'error',
                message: 'Please check your SMTP settings in .env file'
            });
        }
    } catch (error) {
        logger.error('Email configuration test failed:', error);
        returnResponse(res).error('Failed to test email configuration', {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

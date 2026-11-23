import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { 
  loginUser, 
  registerUser, 
  getProfile, 
  sendOTP, 
  verifyOTPController, 
  resetPassword, 
  logout,
  refreshAccessToken,
  changePassword,
  testEmailConfig
} from '../../controllers/authController';
import { 
  loginValidation, 
  validateUserRegistration, 
  sendOTPValidation, 
  verifyOTPValidation, 
  resetPasswordValidation,
  refreshTokenValidation,
  changePasswordValidation
} from '../../validations/auth';

const router = Router();

router.post('/register', validateUserRegistration, validateRequest, registerUser);
router.post('/login', loginValidation, validateRequest, loginUser);
router.post('/refresh-token', refreshTokenValidation, validateRequest, refreshAccessToken);
router.get('/profile', authenticateToken, getProfile);
router.post('/send-otp', sendOTPValidation, validateRequest, sendOTP);
router.post('/verify-otp', verifyOTPValidation, validateRequest, verifyOTPController);
router.post('/reset-password', resetPasswordValidation, validateRequest, resetPassword);
router.post('/change-password', authenticateToken, changePasswordValidation, validateRequest, changePassword);
router.post('/logout', authenticateToken, logout);

// Email configuration test endpoint
router.get('/test-email', testEmailConfig);

export default router; 
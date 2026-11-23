import toast from "react-hot-toast";

export const generatePassword = () => {
    const specialChars = '!@#$%^&*()[]{}<>';
    const numbers = '0123456789';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    
    // Ensure one of each required character type
    let password = '';
    password += specialChars[Math.floor(Math.random() * specialChars.length)]; // One special character
    password += numbers[Math.floor(Math.random() * numbers.length)]; // One number
    password += lowercase[Math.floor(Math.random() * lowercase.length)]; // One lowercase letter
    
    // Fill remaining characters randomly
    const allChars = specialChars + numbers + lowercase + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = password.length; i < 8; i++) { // Ensure minimum 8 characters
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    // Set the generated password in the form
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmPasswordInput = document.querySelector('input[name="confirm_password"]') as HTMLInputElement;
    
    if (passwordInput) passwordInput.value = password;
    if (confirmPasswordInput) confirmPasswordInput.value = password;
    
    // Trigger form validation
    const event = new Event('input', { bubbles: true });
    if (passwordInput) passwordInput.dispatchEvent(event);
    if (confirmPasswordInput) confirmPasswordInput.dispatchEvent(event);
    
    toast.success('New password generated!');
  };
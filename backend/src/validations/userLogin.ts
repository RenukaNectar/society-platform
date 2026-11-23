export const validateUserLogin = async (body: any) => {
    if(!body.email) {
        return 'Email is required';
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return 'Invalid email';
    }
    if(!body.password) {
        return 'Password is required';
    }
    return null;
}
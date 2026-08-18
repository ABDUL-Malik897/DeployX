export const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password) => {
    return (
        password.length >= 6 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    );
};

export const validateRepositoryUrl = (url) => {
    try {
        const parsedUrl = new URL(url);
        return (parsedUrl.protocol === "https:" && parsedUrl.hostname === "github.com");
    } catch {
        return false;
    }
};
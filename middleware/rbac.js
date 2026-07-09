export const authorize = (...roles) => {
    return (req, res, next) => {
        next();
    };
};
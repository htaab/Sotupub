// Middleware to handle 404 (Not Found) errors
// This runs when no other routes match the requested URL
const notFound = (req, res, next) => {
  // Create a new error with the URL that wasn't found
  const error = new Error(`Not Found - ${req.originalUrl}`);
  // Set the response status to 404
  res.status(404);
  // Pass the error to Express's error handling middleware
  next(error);
};

// Global error handling middleware
// This catches all errors passed to next() throughout the application
const errorHandler = (err, req, res, next) => {
  // If the response status is 200 but we hit an error, set it to 500 (Internal Server Error)
  // Otherwise, keep the original error status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Set the response status code
  res.status(statusCode);
  
  // Send error response in JSON format
  res.json({
    message: err.message, // The error message
    // Only show error stack trace in development mode
    // In production (NODE_ENV === "production"), stack will be null
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

// Export both middleware functions
export { notFound, errorHandler };
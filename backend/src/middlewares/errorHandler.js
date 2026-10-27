import config from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || (statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR');

  const response = {
    success: false,
    error: {
      code,
      message,
      ...(!config.isProduction && err.stack ? { stack: err.stack } : {})
    }
  };

  res.status(statusCode).json(response);
};

export default errorHandler;

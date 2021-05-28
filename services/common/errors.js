class AppError extends Error {
  get name() {
    return this.constructor.name;
  }
} 

class ValidationError extends AppError {

}

class EntityNotFoundError extends AppError {

}

class ProcessManagerError extends AppError {

}

class AuthError extends AppError {

}

module.exports = {
  ValidationError,
  EntityNotFoundError,
  ProcessManagerError,
  AuthError
};
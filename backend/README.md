# Tours API - Explore the World with Our Tour Services

## Overview

This project is a comprehensive **Tours API** that provides a platform for users to explore and book tours offered by a company. The API is built using Node.js and Express, with MongoDB Atlas as the database for storing tour and user information. The API includes features like user authentication, role-based access control, data sanitization, and security measures to ensure a safe and robust service.

## Features

- **User Authentication & Authorization**: Users can sign up, log in, and access the API based on their roles (`user`, `guide`, `lead-guide`, `admin`).
- **Tour Management**: Retrieve details of tours offered, including descriptions, prices, and schedules.
- **Role-Based Access Control**: Different functionalities are available to users based on their roles, e.g., only `admin` users can delete tours.
- **Security Enhancements**: Data sanitization, rate limiting, HTTP parameter pollution prevention, and XSS protection are implemented.
- **Data Validation**: Input validation is enforced to ensure the integrity and consistency of the data.
- **Password Reset**: Users can reset their passwords by entering their email addresses. During development, we use Mailtrap to simulate email delivery and ensure the feature works as expected.

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Token)
- **Security**:
  - `bcryptjs` for password hashing
  - `helmet` for securing HTTP headers
  - `xss-clean` for preventing XSS attacks
  - `express-rate-limit` for rate limiting
  - `express-mongo-sanitize` for sanitizing MongoDB queries
  - `hpp` for preventing HTTP parameter pollution
- **Validation**: `validator` for validating user input
- **Emailing**: `nodemailer` for sending emails
- **Logging**: `morgan` for logging HTTP requests

### Installation and Setup

### Installation

1. Clone the Repository

   ```bash
   git clone https://github.com/rb0298/zimyo-fullstack_task
   Navigate to the Backend Folder

   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - **Request the `.env` file**: Please contact the project maintainer to request the `.env` file containing the necessary environment variables.
   - Place the `.env` file in the root directory of the project.

4. Run the server:

   ```bash
   npm start
   ```

### Development & Testing

#### Linting and Formatting

- **ESLint** is configured with the Airbnb style guide to enforce code quality.
- **Prettier** is used for consistent code formatting.

## API Endpoints

### User Endpoints

- **POST** `/api/v1/users/signup` - Create a new user
- **POST** `/api/v1/users/forgotPassword` - Send an email for resetting the password
- **PATCH** `/api/v1/users/resetPassword/:token` - Reset the password
- **PATCH** `/api/v1/users/updateMe` - Update the user details
- **PATCH** `/api/v1/users/updatePassword` - Update the password
- **GET** `/api/v1/users` - Get all users
- **POST** `/api/v1/users/login` - Log in a user

### Tour Endpoints

- **GET** `/api/v1/tours` - Get all tours
- **GET** `/api/v1/tours/:id` - Get a tour by ID
- **POST** `/api/v1/tours` - Create a new tour (Admin only)
- **PATCH** `/api/v1/tours/:id` - Update a tour
- **DELETE** `/api/v1/tours/:id` - Delete a tour (Admin only)
- **GET** `/api/v1/tours/top-5-cheap` - Get top 5 cheap tours
- **GET** `/api/v1/tours/tour-stats` - Get tour statistics

### Example API Requests

#### Sign Up a User

- **Request**:

```bash
POST /api/v1/users/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

- **Response**:

```bash
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "60c72b2f5f1b2c0015d4c9b4",
      "name": "John Doe",
      "email": "john.doe@example.com",
      ...
    }
  }
}
```

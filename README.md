# ADA Blogs Website

## Overview
The ADA Blogs Website is a modern blogging platform designed to showcase innovative web technologies and provide a seamless user experience. Built with cutting-edge tools and frameworks, this project highlights the power of a highly optimized development stack.

## Features
- **Dynamic Blog Management**: Create, edit, and delete blog posts effortlessly.
- **Responsive Design**: A mobile-first layout ensures optimal viewing on any device.
- **Customizable UI**: Powered by shadcn-ui and Tailwind CSS for rich, flexible user interface components.
- **Fast Performance**: Developed using Vite for blazing-fast build and development times.
- **Type Safety**: TypeScript ensures code reliability and maintainability.

## Technologies Used
This project leverages the following technologies:

- **[Vite](https://vitejs.dev/)**: A next-generation frontend tool for lightning-fast builds and development.
- **[TypeScript](https://www.typescriptlang.org/)**: Strongly typed JavaScript for better code quality.
- **[React](https://reactjs.org/)**: A library for building interactive and declarative user interfaces.
- **[shadcn-ui](https://github.com/shadcn/ui)**: A modern UI component library for React applications.
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework for creating custom designs quickly.

## Features

- **User Authentication**: Sign-up, login, email confirmation, and session management.
- **Post Management**: Create, edit, and delete your posts.
- **Public and Private Access**: View posts without logging in; create/edit posts only if logged in.
- **Profile Management**: Update username and password, delete account (removes associated posts).
- **Post Metadata**: Display creation and update timestamps.

## Getting Started
### Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) for package management

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ssa17/ada-blogs-website.git
   ```

2. Navigate to the project directory:
   ```bash
   cd ada-blogs-website
   ```

3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Development
To start the development server:
```bash
npm run dev
# or
yarn dev
```
Access the app at `http://localhost:8000`.

### Testing
1. To run the tests:
   ```bash
   npm test
   ```
2. To run the tests in a UI mode:
   ```bash
   npm test -- --ui
   # or
   npx vitest --ui
   ```

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message here"
   ```
4. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

-------------------------

Short youtube video tutorial:
https://youtu.be/6yILEwkuqRA

## Challenges and Solutions

### Challenge: Integrating Supabase Authentication

- **Issue**: Understanding and securely implementing the Supabase authentication flow.
- **Solution**: Followed Supabase documentation and implemented email confirmation to ensure secure user accounts.

### Challenge: Cascading Deletes

- **Issue**: Deleting user accounts without leaving orphaned posts.
- **Solution**: Used database triggers in Supabase to cascade deletions, ensuring data integrity.

### Challenge: Automated Testing in CI/CD

- **Issue**: Ensuring reliable automated tests across environments.
- **Solution**: Configured GitHub Actions with Vitest to run tests on every push, using mock Supabase services for consistency.

## Team Contributions

Created solely by myself, Syed

## Evidence for Marking Criteria

### Feature Implementation (25%)

- **Addressed Requirements**: Fully implemented login, authorization, CRUD operations, and user roles.
- **Evidence**: See `src/pages/SignIn`, `src/pages/SignUp` and  `src/pages/CreatePost` for implementation details.

### Testing (25%)

- **Addressed Requirements**: Comprehensive unit tests and integration tests with Vitest.
- **Evidence**: See `tests` directory for test cases and coverage report.

### Security Enhancements (15%)

- **Addressed Requirements**: Password hashing, input validation, CSRF protection, and XSS safeguards.
- **Evidence**: Supabase authentication docs.
- **Supporting Material**: Configuration in Supabase for authentication security.

### Code Quality and Refactoring (15%)

- **Addressed Requirements**: Modular structure, meaningful comments, adherence to coding standards.
- **Evidence**: Refer to `src/components` and `src/pages` for modular implementation.
- **Supporting Material**: Inline comments in critical areas.

### CI/CD and Git Practices (20%)

- **Addressed Requirements**: Automated testing and deployment with GitHub Actions.
- **Evidence**: See `.github/workflows` for CI/CD pipeline configuration.
- **Supporting Material**: Screenshot of successful GitHub Actions runs.


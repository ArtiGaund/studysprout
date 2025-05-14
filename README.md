# StudySprout

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Project Overview

StudySprout is a web application built with Next.js and TypeScript. It leverages modern tools like Tailwind CSS for styling and integrates with external services like Cloudinary for image hosting. The project is designed to be scalable and maintainable, with a modular structure for components, context, and utilities.

## Features

- **Next.js Framework**: Server-side rendering, static site generation, and API routes.
- **TypeScript**: Strongly typed codebase for better maintainability.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- **Cloudinary Integration**: Image hosting and optimization.
- **Custom Email Templates**: Predefined email templates in the `emails` directory.
- **Dynamic Routing**: Built-in support for dynamic routes and API endpoints.

## Getting Started

To get started with the project, follow these steps:

### Prerequisites

Ensure you have the following installed:

- Node.js (v16 or later)
- npm, yarn, pnpm, or bun (choose one package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/studysprout.git
   cd studysprout
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and configure the required variables. Refer to `.env.example` if available.

### Running the Development Server

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

To build the project for production:

```bash
npm run build
```

The output will be available in the `.next` directory.

### Linting and Formatting

Run the following commands to lint and format the code:

```bash
npm run lint
npm run format
```

## Project Structure

```
.
├── .env.local               # Environment variables
├── components.json          # Component metadata
├── next.config.mjs          # Next.js configuration
├── postcss.config.mjs       # PostCSS configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── src/
│   ├── app/                 # Application pages and layouts
│   ├── components/          # Reusable UI components
│   ├── context/             # React context providers
│   ├── helpers/             # Utility functions
│   ├── lib/                 # External libraries and integrations
│   ├── model/               # Data models
│   ├── schemas/             # Validation schemas
│   ├── store/               # State management
│   ├── types/               # TypeScript types
│   └── constants.ts         # Application constants
├── emails/                  # Email templates
└── public/                  # Static assets
```

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Known Issues

- **Image Loading Issue**: Icons in the sidebar are not loading correctly. To resolve this, ensure the following configuration is added to `next.config.mjs`:
  ```javascript
  images: {
    domains: ['res.cloudinary.com'],
  },
  ```
  Use image URLs instead of public IDs when referencing images.

## Learn More

To learn more about the technologies used in this project, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API.
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Learn how to style your application.
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - Learn about TypeScript features.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the project.

## License

This project is licensed under the [MIT License](LICENSE).
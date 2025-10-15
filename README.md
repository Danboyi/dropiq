# DropIQ 🚀

<div align="center">

**AI-Powered Dropshipping Platform**

A comprehensive, scalable fullstack application built with modern web technologies and intelligent product sourcing capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Nx](https://img.shields.io/badge/Nx-19.8.4-blue.svg)](https://nx.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)

</div>

## 🌟 Features

### 🤖 AI-Powered Intelligence
- **Smart Product Sourcing**: AI-driven recommendations for profitable products
- **Price Optimization**: Dynamic pricing strategies based on market analysis
- **Trend Analysis**: Real-time market trend identification and forecasting

### 📊 Analytics & Insights
- **Real-time Dashboard**: Comprehensive overview of business metrics
- **Revenue Analytics**: Detailed revenue tracking and growth analysis
- **Customer Behavior**: Insights into customer preferences and patterns

### 🔧 Developer Experience
- **Type Safety**: Full TypeScript coverage across all applications
- **Hot Module Replacement**: Instant development feedback
- **Comprehensive Testing**: Unit, integration, and E2E test coverage
- **Modern Tooling**: ESLint, Prettier, Husky for code quality

## 🏗️ Architecture

### Monorepo Structure

DropIQ uses **Nx** to manage a scalable monorepo architecture:

```
dropiq/
├── apps/                    # Applications
│   ├── frontend/           # Next.js 14 frontend
│   ├── backend/            # Node.js/Express API
│   └── docs/               # Docusaurus documentation
├── libs/                   # Shared libraries
│   └── shared/             # Common types and utilities
├── tools/                  # Build and development tools
├── configs/                # Configuration files
└── scripts/                # Utility scripts
```

### Technology Stack

#### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library

#### Backend
- **Node.js 18** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript 5** - Type-safe JavaScript
- **Zod** - Schema validation

#### Infrastructure
- **Nx** - Monorepo management
- **Docker** - Containerization
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+ or **yarn** 1.22+
- **Docker** & **Docker Compose**
- **Git**

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Danboyi/dropiq.git
   cd dropiq
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development services**
   ```bash
   npm run docker:up
   npm run dev
   ```

5. **Access your applications**
   - 🌐 Frontend: http://localhost:3000
   - 🔧 Backend API: http://localhost:3333
   - 📚 Documentation: http://localhost:3001

## 📁 Project Structure

### Applications (`apps/`)

#### Frontend (`apps/frontend/`)
Next.js 14 application with TypeScript and Tailwind CSS

#### Backend (`apps/backend/`)
Node.js/Express API with TypeScript and security middleware

#### Documentation (`apps/docs/`)
Docusaurus documentation site

### Shared Library (`libs/shared/`)
Common types, utilities, and validation schemas

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                  # Start all applications
npm run dev:frontend         # Start frontend only
npm run dev:backend          # Start backend only
npm run dev:docs             # Start documentation only

# Building
npm run build                # Build all applications
npm run build:frontend       # Build frontend only
npm run build:backend        # Build backend only
npm run build:docs           # Build documentation only

# Testing
npm run test                 # Run all tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Run tests with coverage

# Linting & Formatting
npm run lint                 # Lint all projects
npm run format               # Format code with Prettier
npm run format:check         # Check code formatting

# Docker
npm run docker:up            # Start Docker services
npm run docker:down          # Stop Docker services
npm run docker:logs          # View Docker logs
```

## 🐳 Docker Development

### Services

- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **Backend**: Node.js API server
- **Frontend**: Next.js application
- **Documentation**: Docusaurus site

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 Documentation

Start the documentation site locally:

```bash
npm run dev:docs
# Visit http://localhost:3001
```

## 🚀 Deployment

### Environment Variables

Configure your environment variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"
REDIS_URL="redis://host:6379"

# Application
NODE_ENV="production"
PORT=3333
FRONTEND_URL="https://yourdomain.com"

# Authentication
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Nx Team** - Excellent monorepo tools
- **Vercel** - Next.js framework
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful components

---

<div align="center">

**Built with ❤️ by the DropIQ Team**

</div>
# MotoGT Admin Dashboard

> A comprehensive admin dashboard for managing the MotoGT automotive accessories e-commerce platform.

[![Deployed on AWS](https://img.shields.io/badge/Deployed%20on-AWS%20ECS-FF9900?style=for-the-badge&logo=amazon-aws)](https://admin.motogt.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**Production URL**: [https://admin.motogt.com](https://admin.motogt.com)

---

## 📋 Table of Contents

- [Project Description](#-project-description)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Run Locally](#run-locally)
- [Deployment](#-deployment)
  - [Production Deployment](#production-deployment)
  - [Docker](#docker)
- [Features](#-features)
- [API Integration](#-api-integration)

---

## 🎯 Project Description

The MotoGT Admin Dashboard is a modern web application built with Next.js that provides a comprehensive interface for managing all aspects of the MotoGT e-commerce platform. It enables administrators to:

- Manage product catalog (cars, automotive parts, and accessories)
- Process and track customer orders
- Manage user accounts and permissions
- Handle inventory and stock levels
- Create and manage promotional coupons and discounts
- Configure collections and categories
- Manage content (CMS) and legal pages
- Handle customer support tickets
- Configure garage and vehicle fitment data
- Send marketing emails

The dashboard is designed with a focus on performance, user experience, and scalability, deployed on AWS ECS with automatic CI/CD through GitHub Actions.

---

## 🛠 Tech Stack

### Frontend
- **[Next.js 16.0](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript 5.0](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Headless UI components
- **[Recharts](https://recharts.org/)** - Chart library for analytics
- **[React Hook Form](https://react-hook-form.com/)** - Form management
- **[Zod](https://zod.dev/)** - Schema validation

### Development & Build Tools
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[ESLint](https://eslint.org/)** - Code linting
- **[PostCSS](https://postcss.org/)** - CSS processing

### Backend Integration
- **REST API** - Integration with MotoGT backend API
- **JWT Authentication** - Secure token-based auth

### DevOps & Deployment
- **[Docker](https://www.docker.com/)** - Containerization
- **[AWS ECS Fargate](https://aws.amazon.com/fargate/)** - Serverless container orchestration
- **[AWS ECR](https://aws.amazon.com/ecr/)** - Container registry
- **[AWS CloudFront](https://aws.amazon.com/cloudfront/)** - Global CDN
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD automation

---

## 📁 Project Structure

```
MotoGT-Admin-Dashboard/
├── .aws/
│   └── task-definition.json      # ECS task configuration
├── .github/
│   └── workflows/
│       ├── deploy.yml            # Production deployment workflow
│       └── ci.yml                # Continuous integration checks
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Root page (auth redirect)
│   ├── login/                   # Login page
│   └── dashboard/               # Protected dashboard routes
│       ├── layout.tsx           # Dashboard layout with sidebar
│       ├── page.tsx             # Dashboard home
│       ├── admins/              # Admin management
│       ├── cars/                # Car catalog management
│       ├── categories/          # Category management
│       ├── cms/                 # Content management
│       ├── collections/         # Collection management
│       ├── coupons/             # Coupon management
│       ├── discounts/           # Discount management
│       ├── emails/              # Email management
│       ├── garage/              # Garage management
│       ├── inventory/           # Inventory tracking
│       ├── legal-cms/           # Legal content
│       ├── orders/              # Order management
│       ├── products/            # Product management
│       ├── settings/            # System settings
│       ├── support/             # Customer support
│       └── users/               # User management
├── components/                   # Reusable React components
│   ├── ui/                      # UI component library (Radix-based)
│   ├── app-sidebar.tsx          # Application sidebar
│   ├── header.tsx               # Header component
│   └── protected-route.tsx      # Auth protection wrapper
├── lib/                         # Utilities and helpers
│   ├── context/
│   │   └── auth-context.tsx    # Authentication context
│   ├── services/                # API service layer
│   │   ├── auth.service.ts     # Authentication API
│   │   ├── car.service.ts      # Car API
│   │   ├── order.service.ts    # Order API
│   │   ├── user.service.ts     # User API
│   │   └── upload.service.ts   # File upload API
│   ├── api-client.ts           # Axios HTTP client
│   ├── config.ts               # App configuration
│   └── utils.ts                # Utility functions
├── public/                      # Static assets
│   └── images/                 # Image assets
├── Dockerfile                   # Docker container definition
├── docker-compose.yml          # Local Docker setup (optional)
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **pnpm** 8.x or higher
- **Git**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/MotoGT-Com/MotoGT-Admin-Dashboard.git
cd MotoGT-Admin-Dashboard
```

2. **Install dependencies**

```bash
pnpm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.motogt.com/api
```

> **Note**: Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

### Run Locally

**Development mode** (with hot reload):

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

**Production build** (local):

```bash
pnpm build
pnpm start
```

**Linting**:

```bash
pnpm lint
```

---

## 🚢 Deployment

### Production Deployment

The application is automatically deployed to AWS ECS via GitHub Actions on every push to the `main` branch.

**Deployment Flow:**

1. **Code Push** → GitHub repository (`main` branch)
2. **GitHub Actions** triggers automatically
3. **Docker Build** → Image built with production env vars
4. **Push to ECR** → Docker image pushed to AWS Elastic Container Registry
5. **ECS Deployment** → New task definition deployed to ECS Fargate
6. **Health Checks** → Service stability verification
7. **Live** → Available at `https://admin.motogt.com`

**Required GitHub Secrets:**

| Secret Name | Description |
|------------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL |

**Manual Deployment** (if needed):

```bash
# Build and push Docker image
docker build -t motgt-admin-dashboard .
docker tag motgt-admin-dashboard:latest 653306034344.dkr.ecr.me-central-1.amazonaws.com/motgt-admin-dashboard:latest
docker push 653306034344.dkr.ecr.me-central-1.amazonaws.com/motgt-admin-dashboard:latest

# Force new ECS deployment
aws ecs update-service --cluster motgt-cluster --service motgt-admin-service --force-new-deployment --region me-central-1
```

### Docker

**Build locally:**

```bash
docker build -t motgt-admin-dashboard .
```

**Run container:**

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://api.motogt.com/api \
  motgt-admin-dashboard
```

**Using Docker Compose:**

```bash
docker-compose up
```

---

## ✨ Features

### Authentication & Authorization
- JWT-based authentication
- Protected routes with middleware
- Role-based access control
- Persistent login sessions

### Dashboard Analytics
- Real-time statistics and metrics
- Order tracking and analytics
- Revenue charts and reports
- User activity monitoring

### Product Management
- Full CRUD operations for products
- Image upload and management
- Category and collection assignment
- Inventory tracking
- Bulk operations

### Order Management
- Order listing and filtering
- Order details and status updates
- Customer information
- Invoice generation
- Order history tracking

### User Management
- User listing and search
- User profile management
- Role assignment
- Activity logs

### Content Management
- CMS for static pages
- Legal content management
- Email template management
- Media library

### System Configuration
- Application settings
- Integration configurations
- Backup and restore
- Audit logs

---

## 🔌 API Integration

The dashboard integrates with the MotoGT backend API hosted at `https://api.motogt.com/api`.

**API Client Configuration:**

```typescript
// lib/api-client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Authentication:**

```typescript
// Automatic token injection
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 📝 License

This project is proprietary software owned by MotoGT. All rights reserved.

---

## 👥 Team

Developed and maintained by the MotoGT development team.

---

## 📞 Support

For issues or questions, please contact the development team or create an issue in the repository.

**Last Updated:** November 23, 2025

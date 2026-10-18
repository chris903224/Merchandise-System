# SJC Merchandise

**A Student-Centered E-Commerce Platform for Saint Jude College Manila**

SJC Merchandise is a web-based e-commerce platform designed to simplify the process of browsing, purchasing, and tracking school merchandise within the Saint Jude College community. It provides a centralized platform for school-related products, order management, and online payment processing.

The project focuses on improving the student purchasing experience through an organized product catalog, inventory tracking, and a streamlined checkout process.

**Live Demo:** https://merchandise-system.vercel.app/

## Overview

Traditional school merchandise purchasing may involve manual inquiries, messaging, and limited visibility into product availability and order status. SJC Merchandise aims to provide a more organized digital experience by bringing essential purchasing features together in one platform.

The system is designed around the needs of students while supporting administrative and organizational workflows.

## Key Features

- **Product Catalog** — Browse school merchandise and view product details.
- **Inventory Management** — Track product availability and size-specific stock.
- **Shopping Cart** — Add products and manage selected items before checkout.
- **Online Checkout** — Submit orders through a structured checkout flow.
- **Online Payments** — Integration with PayMongo-hosted payment flows, including supported GCash payments.
- **Order Tracking** — View order history and monitor order statuses.
- **User Authentication** — Registration, login, and account-related functionality.
- **Email Notifications** — Email communication through Brevo integration.
- **Profile Management** — Manage supported profile information and preferences.
- **Favorites and Notifications** — Access saved products and relevant account updates.
- **Administrative Workflows** — Dedicated administrative interfaces for supported management operations.
- **Responsive User Interface** — A modern interface designed for convenient interaction.
- **Multilingual Interface** — Language selection to make the interface accessible to users with different language preferences.

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend and Database
- Supabase
- PostgreSQL
- Supabase Authentication
- Row Level Security (RLS)

### Integrations and Deployment
- PayMongo — Payment processing
- Brevo — Email communication
- Vercel — Web deployment

## System Architecture

SJC Merchandise follows a layered web application approach:

1. **Presentation Layer** — Displays the interface and handles user interactions.
2. **Application Layer** — Coordinates UI state, product selection, cart interactions, and application workflows.
3. **Service and Integration Layer** — Connects application features to backend services and external integrations.
4. **Backend and Database Layer** — Handles persistent data, authentication-related operations, and database access controls.
5. **External Services** — Supports payment processing and email delivery through integrated providers.

This separation helps organize application responsibilities and makes the system easier to maintain and extend.

## Security Considerations

Security is an important consideration in the development of SJC Merchandise.

The project uses Supabase authentication and database access policies to support controlled access to application data. Row Level Security policies can enforce data-access rules at the database level, while application-side validation helps guide users through expected workflows.

Sensitive credentials for server-side integrations should be stored in environment variables and must not be exposed in client-side code.

Security controls must be validated through appropriate authorization tests, database policy reviews, and deployment configuration checks.

## Deployment

The application is deployed using Vercel.

Live application: https://merchandise-system.vercel.app/

Deployment configuration and environment variables must be maintained separately from source code. Required credentials should be configured through the appropriate deployment environment rather than committed to the repository.

## Project Goals

SJC Merchandise was developed to explore how a centralized e-commerce platform can support school merchandise purchasing and related workflows.

The project emphasizes:

- Practical application of full-stack web development
- Integration of frontend and backend services
- Database-driven product and order management
- Payment workflow integration
- User experience and interface design
- Security-aware application development
- Maintainable and extensible system architecture

## Future Improvements

Potential areas for further development include:

- Expanded role-based access control
- More comprehensive audit logs and administrative activity tracking
- Automated testing for critical purchasing and authorization workflows
- Enhanced inventory and order analytics
- Additional performance and accessibility improvements
- Further security testing and deployment hardening

## Project Status

SJC Merchandise is an ongoing software development project. Feature availability and operational behavior may vary as development and testing continue.

## License

No license has been specified yet. All rights and reuse permissions remain subject to the repository owner's decision until a license is added.

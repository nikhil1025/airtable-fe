# Airtable FE

> A modern frontend application built with Angular, featuring data visualization and grid management capabilities

## Description

Airtable FE is a feature-rich frontend application that provides powerful data management and visualization tools. Built with Angular 19 and enhanced with AG Grid and AG Charts, this application delivers a seamless experience for handling complex datasets, creating interactive tables, and generating insightful visualizations.

**Who it's for:**
- Developers building data-intensive web applications
- Teams needing customizable grid and chart components
- Projects requiring modern, scalable frontend architecture

**Key Benefits:**
- High-performance data grids with AG Grid
- Interactive charting capabilities with AG Charts
- Modern Angular Material UI components
- Docker-ready for easy deployment
- TypeScript for type-safe development

## Tech Stack

**Frontend:**
- **Framework:** Angular 19.2
- **Language:** TypeScript 5.7
- **UI Library:** Angular Material 19.2
- **Data Grid:** AG Grid Community 34.3 (Angular integration)
- **Charts:** AG Charts Community 12.3 (Angular integration)
- **Styling:** SCSS
- **State Management:** RxJS 7.8

**DevOps / Tools:**
- Docker & Docker Compose
- Node.js 22.x
- Angular CLI 19
- Karma & Jasmine (Testing)

## Features

- ✅ **Interactive Data Grids:** Powerful table management with sorting, filtering, and editing via AG Grid
- 📊 **Data Visualization:** Create dynamic charts and graphs with AG Charts
- 🎨 **Material Design:** Clean, responsive UI using Angular Material components
- 🔄 **Reactive Architecture:** Built on RxJS for efficient data flow and state management
- 🐳 **Containerized:** Docker and Docker Compose ready for consistent development and deployment
- 🔒 **Type Safety:** Full TypeScript support for robust, maintainable code
- ⚡ **Performance Optimized:** Production builds with Angular's AOT compilation
- 🧪 **Testable:** Pre-configured testing setup with Karma and Jasmine

## Project Structure

```
airtable-fe/
├── src/
│   ├── app/              # Application components, services, and modules
│   ├── environments/     # Environment-specific configuration
│   ├── index.html        # Main HTML file
│   ├── main.ts          # Application entry point
│   └── styles.scss      # Global styles
├── public/              # Static assets
├── Dockerfile           # Docker configuration for containerization
├── docker-compose. yml   # Docker Compose orchestration
├── angular.json         # Angular workspace configuration
├── package.json         # NPM dependencies and scripts
└── tsconfig.json        # TypeScript compiler configuration
```

## Installation

### Prerequisites

- **Node.js** 22.x or higher
- **npm** (comes with Node.js)
- **Angular CLI** 19 (optional, will be installed locally)
- **Docker** (optional, for containerized deployment)

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nikhil1025/airtable-fe. git
   cd airtable-fe
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   
   *Note: If you encounter peer dependency issues, use: *
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Verify installation:**
   ```bash
   npx ng version
   ```

## Environment Variables

Currently, the application uses Angular's built-in environment configuration system. 

Create or modify environment files in `src/environments/`:

- `environment.ts` - Development configuration
- `environment.prod.ts` - Production configuration

**Common environment variables:**

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api', // Backend API URL
  // Add other configuration here
};
```

## Running the Project

### Development Mode

**Using npm:**
```bash
npm start
```
The application will be available at `http://localhost:4200`

**Using Angular CLI directly:**
```bash
npx ng serve
```

**Watch mode (auto-rebuild on changes):**
```bash
npm run watch
```

### Production Build

**Build for production:**
```bash
npm run build
```

Output will be in the `dist/` directory.

### Running Tests

```bash
npm test
```

### Docker Deployment

**Using Docker Compose (recommended):**
```bash
docker-compose up --build
```

**Using Docker directly:**
```bash
# Build the image
docker build -t airtable-frontend: latest .

# Run the container
docker run -p 4200:4200 airtable-frontend:latest
```

Access the application at `http://localhost:4200`

## API Documentation

*This is a frontend-only application. Configure the backend API endpoint in your environment files.*

**Expected Backend Configuration:**
- Set `apiUrl` in `src/environments/environment.ts`
- Ensure CORS is properly configured on your backend
- Use Angular's HttpClient for API calls

**Example API Integration:**
```typescript
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

// In your service
this.http.get(`${environment.apiUrl}/endpoint`);
```

## Deployment
a
### Hosting Suggestions

**Recommended Platforms:**
- **Vercel** - Zero-config Angular deployments
- **Netlify** - Continuous deployment from Git
- **AWS S3 + CloudFront** - Scalable static hosting
- **Firebase Hosting** - Fast global CDN
- **Docker** - Any container orchestration platform (Kubernetes, ECS, etc.)

### Deployment Steps

**For Static Hosting (Vercel, Netlify, Firebase):**

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Deploy the `dist/airtable-fe/browser` directory

**For Docker/Container Platforms:**

1. Build and push the Docker image:
   ```bash
   docker build -t your-registry/airtable-frontend:latest .
   docker push your-registry/airtable-frontend:latest
   ```

2. Deploy using your orchestration tool (Kubernetes, Docker Swarm, etc.)

## Screenshots / Demo

<!-- Add screenshots here -->
*Coming soon*

<!-- Example: 
![Dashboard View](docs/images/dashboard. png)
![Data Grid](docs/images/grid-view.png)
-->

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes:**
   ```bash
   git commit -m "Add:  description of your changes"
   ```
4. **Push to your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**

### Coding Standards

- Follow Angular style guide:  https://angular.dev/style-guide
- Use TypeScript strict mode
- Write unit tests for new features
- Use meaningful commit messages (conventional commits preferred)
- Ensure all tests pass before submitting PR:  `npm test`
- Format code consistently (use EditorConfig settings provided)

## License

This project is private and does not currently have a specified license.  Please contact the repository owner for usage permissions.

---

**Author:** [nikhil1025](https://github.com/nikhil1025)

**Repository:** [github.com/nikhil1025/airtable-fe](https://github.com/nikhil1025/airtable-fe)

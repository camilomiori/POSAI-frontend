# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with forced cache refresh (runs on port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm clean` - Clean node_modules, .vite cache, and dist folder

## Project Architecture

### Tech Stack
- **React 18** with Vite as build tool
- **React Router v7** for routing
- **TanStack React Query** for server state management
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons

### Application Structure

**Multi-Context Architecture**: The app uses multiple React contexts layered in a specific order:
- `AuthProvider` (outer) - User authentication and permissions
- `ToastProvider` - Global toast notifications  
- `NotificationProvider` - System notifications
- `CartProvider` (inner) - Shopping cart state

**Routing Structure**: All protected routes are wrapped in `MainLayoutFixed` component:
- `/login` - Public login page (`LoginBright`)
- `/dashboard` - Dashboard (`DashboardSimple`) 
- `/ventas` - Sales interface (`VentasFacturacion`)
- `/productos` - Products management
- `/ai-center` - AI features (`AICenterEnhanced`)
- `/administracion` - Admin-only section (requires `adminOnly: true`)
- `/configuracion` - System config (requires `manage_system` permission)
- `/usuario` - User profile

### Service Layer Architecture

**API Service (`src/services/api.js`)**: 
- Centralized HTTP client with automatic retry logic and exponential backoff
- Mock mode fallback for development - automatically falls back to mock data when real API fails
- Built-in auth token management with localStorage persistence
- Comprehensive error handling with specific messages for different HTTP status codes
- All API methods return mock data as fallback, making the app fully functional offline

**AI Engine (`src/services/aiEngine.js`)**:
- Comprehensive AI system for demand prediction, price optimization, and business insights
- Uses mock data for realistic predictions and recommendations
- Includes customer segmentation, market analysis, and performance metrics
- All AI features work independently without external APIs

### State Management Patterns

**Authentication**: Role-based access control with three roles:
- `admin` - Full system access
- `supervisor` - Sales and inventory management
- `cajero` - Basic sales operations

**Permission System**: Granular permissions like `manage_users`, `view_analytics`, `use_ai_features`, etc.

**Data Flow**: 
1. Services export either singleton instances or async imports for code splitting
2. React Query manages server state and caching
3. Context providers handle global client state
4. Mock data provides realistic fallbacks for all operations

### Key Development Notes

**Mock Data Integration**: The entire application works with mock data by design. All services gracefully fall back to mock implementations, making development and testing seamless without requiring a backend.

**Dynamic Imports**: Services use dynamic imports (`import()`) for better code splitting and performance, especially for AI engine and mock data.

**Permission-based UI**: Components should check permissions using `hasPermission()` hook from AuthContext before rendering sensitive features.

**Toast Integration**: Use ToastContext for user feedback rather than browser alerts.

## File Organization

- `src/contexts/` - React context providers (Auth, Toast, Cart, Notification)
- `src/services/` - API service, AI engine, and mock data
- `src/pages/` - Main application pages
- `src/components/ui/` - Reusable UI components
- `src/components/layout/` - Layout components (headers, sidebars)
- `src/components/common/` - Common components (ErrorBoundary, LoadingSpinner, etc.)
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions and constants

## Development Workflow

When working with this codebase:
1. The app is designed to work fully offline with mock data
2. All API calls automatically fall back to mock implementations
3. Authentication uses predefined demo users (admin/admin123, cajero/cajero123, demo/demo)
4. AI features generate realistic predictions using mock algorithms
5. Test permission-based features using different user roles
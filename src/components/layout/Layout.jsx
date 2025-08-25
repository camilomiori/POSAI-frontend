// Layout components centralizados
export { default as Header } from './Header';
export { default as Sidebar } from './Sidebar';
export { default as NotificationBell } from './NotificationBell';

// Layout principal que combina todos los componentes
export { default as MainLayout } from './MainLayout';

// Configuraciones y utilidades de layout
export const layoutConfig = {
  sidebar: {
    defaultWidth: 256, // 64 * 4 = w-64
    collapsedWidth: 64, // 16 * 4 = w-16
    breakpoint: 1024   // lg breakpoint
  },
  
  header: {
    height: 64, // h-16
    zIndex: 40
  },
  
  notifications: {
    maxVisible: 5,
    autoHide: 5000, // 5 segundos
    position: 'top-right'
  }
};

// Hooks para manejar responsive layout
export const useResponsiveLayout = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < layoutConfig.sidebar.breakpoint;
      setIsMobile(mobile);
      
      // Auto close sidebar on mobile when resizing to mobile
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  return {
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar: () => setSidebarOpen(!sidebarOpen)
  };
};
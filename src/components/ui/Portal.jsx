// components/ui/Portal.jsx
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

const Portal = ({ children, container }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const portalContainer = container || document.body;
  
  return createPortal(children, portalContainer);
};

export { Portal };
export default Portal;
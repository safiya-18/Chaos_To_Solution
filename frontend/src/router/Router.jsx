import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const RouterContext = createContext({
  currentPath: '/',
  navigate: () => {}
});

/**
 * Normalizes a pathname to match supported routes ('/', '/timer', '/teams').
 */
function normalizePath(pathname) {
  if (!pathname || pathname === '' || pathname === '/') return '/';
  if (pathname.startsWith('/timer')) return '/timer';
  if (pathname.startsWith('/teams')) return '/teams';
  return '/';
}

export function RouterProvider({ children }) {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window === 'undefined') return '/';
    return normalizePath(window.location.pathname);
  });

  const navigate = useCallback((to) => {
    const target = normalizePath(to);
    if (typeof window !== 'undefined' && window.location.pathname !== target) {
      window.history.pushState({}, '', target);
      setCurrentPath(target);
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

export function Link({ to, children, className = '', onClick, ...props }) {
  const { navigate } = useRouter();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <a href={to} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}

export default RouterProvider;

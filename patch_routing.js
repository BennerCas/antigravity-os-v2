const fs = require('fs');
const path = 'apps/web-app/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';

function RouteTracker() {
  const location = useLocation();
  React.useEffect(() => {
    if (location.pathname !== '/') {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location]);
  return null;
}

function InitialRedirect() {
  const lastRoute = localStorage.getItem('lastRoute') || '/atlas';
  return <Navigate to={lastRoute} replace />;
}`;

content = content.replace(
    "import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';",
    replacement
);

content = content.replace(
    '<div className="flex h-screen bg-[#090a0c] text-white overflow-hidden">',
    '<RouteTracker />\n      <div className="flex h-screen bg-[#090a0c] text-white overflow-hidden">'
);

content = content.replace(
    '<Route path="/" element={<Navigate to="/atlas" replace />} />',
    '<Route path="/" element={<InitialRedirect />} />'
);

fs.writeFileSync(path, content, 'utf8');
console.log("App.tsx modified for sticky routing");

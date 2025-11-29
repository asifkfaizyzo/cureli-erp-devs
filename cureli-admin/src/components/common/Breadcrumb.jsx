import { memo } from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav className="flex items-center text-sm text-gray-500">
      <Link 
        to="/" 
        className="flex items-center hover:text-gray-700 transition-colors"
      >
        <Home size={16} />
      </Link>
      
      {pathnames.map((name, index) => {
  const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
  const isLast = index === pathnames.length - 1;
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <span key={index}>
      {!isLast ? (
        <Link to={routeTo} className="hover:text-blue-400">
          {displayName}
        </Link>
      ) : (
        <span className="text-gray-400">{displayName}</span>
      )}
      {!isLast && <span className="mx-2 text-gray-600">/</span>}
    </span>
  );
})}

    </nav>
  );
};

export default memo(Breadcrumb);
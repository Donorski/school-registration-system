import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  return (
    <div key={location.key} className="animate-page-enter">
      {children}
    </div>
  );
}

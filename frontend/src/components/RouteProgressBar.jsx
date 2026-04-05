import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteProgressBar() {
  const location = useLocation();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setWidth(0);
    let t2, t3, t4;
    const raf = requestAnimationFrame(() => {
      setWidth(55);
      t2 = setTimeout(() => setWidth(80), 250);
      t3 = setTimeout(() => {
        setWidth(100);
        t4 = setTimeout(() => setVisible(false), 250);
      }, 550);
    });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[2px] pointer-events-none">
      <div
        className="h-full bg-emerald-500 transition-[width] ease-out"
        style={{
          width: `${width}%`,
          transitionDuration: width === 0 ? '0ms' : width === 100 ? '200ms' : '450ms',
        }}
      />
    </div>
  );
}

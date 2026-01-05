// hooks/useDynamicRowCount.js
import { useState, useEffect } from 'react';

const useRowCommuniacton = () => {
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    // Initialize with correct value based on current width
    const width = window.innerWidth;
    if (width >= 2560) return 12;
    if (width >= 1920) return 10;
    if (width >= 1440) return 6;
    if (width >= 1366) return 5;
    return 5;
  });

  useEffect(() => {
    const updateRowCount = () => {
      const width = window.innerWidth;
      let count = 6; // Default / Mobile

      if (width >= 2560) count = 15;       // 4K / 27 inch
      else if (width >= 1920) count = 14;  // 1080p Full HD
      else if (width >= 1440) count = 10;  // 19 inch / high res laptop
      else if (width >= 1366) count = 8;   // 14 inch laptop
      else count = 6;

      setRowsPerPage(count);
    };

    // Run on mount
    updateRowCount();
    
    window.addEventListener('resize', updateRowCount);
    return () => window.removeEventListener('resize', updateRowCount);
  }, []);

  return rowsPerPage;
};

export default useRowCommuniacton;
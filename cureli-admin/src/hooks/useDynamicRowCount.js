// cureli-admin\src\hooks\useDynamicRowCount.js
import { useState, useEffect } from 'react';

const useDynamicRowCount = () => {
  const [rowsPerPage, setRowsPerPage] = useState(6);

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

    updateRowCount();
    window.addEventListener('resize', updateRowCount);
    return () => window.removeEventListener('resize', updateRowCount);
  }, []);

  return rowsPerPage;
};

export default useDynamicRowCount;
// src/hooks/useDynamicRowCount.js
import { useState, useEffect, useRef } from 'react';

const DEFAULT_BREAKPOINTS = {
  1200: 15,
  1000: 15,
  800: 15,
  600: 10,
  400: 8,
};

/**
 * Dynamic row count hook based on screen HEIGHT
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.breakpoints - Custom breakpoints { height: rowCount }
 * @param {number} options.fallback - Fallback row count
 * @param {number} options.debounceMs - Debounce delay in ms
 * @returns {number} Number of rows to display
 */
const useDynamicRowCount = (options = {}) => {
  const {
    breakpoints = DEFAULT_BREAKPOINTS,
    fallback = 5,
    debounceMs = 150,
  } = options;

  const [rowsPerPage, setRowsPerPage] = useState(fallback);
  const timeoutRef = useRef(null);
  const prevCountRef = useRef(fallback);

  useEffect(() => {
    const calculateRowCount = (height) => {
      const sorted = Object.entries(breakpoints)
        .map(([h, count]) => [parseInt(h, 10), count])
        .filter(([h]) => !Number.isNaN(h))
        .sort((a, b) => b[0] - a[0]);

      for (const [minHeight, count] of sorted) {
        if (height >= minHeight) {
          return count;
        }
      }
      return fallback;
    };

    const updateRowCount = () => {
      const newCount = calculateRowCount(window.innerHeight);
      
      // Only update if changed
      if (newCount !== prevCountRef.current) {
        prevCountRef.current = newCount;
        setRowsPerPage(newCount);
      }
    };

    const handleResize = () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(updateRowCount, debounceMs);
    };

    // Initial calculation (no debounce)
    updateRowCount();

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutRef.current);
    };
  }, [breakpoints, fallback, debounceMs]);

  return rowsPerPage;
};

export default useDynamicRowCount;
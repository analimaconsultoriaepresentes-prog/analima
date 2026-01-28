import { useState, useEffect, useCallback, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  /** Storage key for persistence */
  storageKey: string;
  /** Whether to save position per route */
  perRoute?: boolean;
  /** Current route (required if perRoute is true) */
  currentRoute?: string;
  /** Element dimensions for bounds calculation */
  elementSize?: { width: number; height: number };
  /** Margin from screen edges */
  margin?: number;
  /** Minimum drag distance to differentiate from click */
  dragThreshold?: number;
  /** Whether to snap to nearest edge on release */
  snapToEdge?: boolean;
  /** Default position (defaults to bottom-right) */
  defaultPosition?: Position;
}

interface UseDraggableReturn {
  position: Position;
  isDragging: boolean;
  wasDragged: boolean;
  handleMouseDown: (e: React.MouseEvent | React.TouchEvent) => void;
  resetPosition: () => void;
  resetAllPositions: () => void;
}

const DEFAULT_MARGIN = 12;
const DEFAULT_DRAG_THRESHOLD = 8;
const DEFAULT_ELEMENT_SIZE = { width: 96, height: 96 };

export function useDraggable(options: UseDraggableOptions): UseDraggableReturn {
  const {
    storageKey,
    perRoute = true,
    currentRoute = "global",
    elementSize = DEFAULT_ELEMENT_SIZE,
    margin = DEFAULT_MARGIN,
    dragThreshold = DEFAULT_DRAG_THRESHOLD,
    snapToEdge = true,
    defaultPosition,
  } = options;

  // Calculate default position (bottom-right with margin)
  const getDefaultPosition = useCallback((): Position => {
    if (defaultPosition) return defaultPosition;
    
    if (typeof window === "undefined") {
      return { x: 0, y: 0 };
    }
    
    return {
      x: window.innerWidth - elementSize.width - margin,
      y: window.innerHeight - elementSize.height - margin,
    };
  }, [defaultPosition, elementSize.width, elementSize.height, margin]);

  // Get storage key based on route
  const getFullStorageKey = useCallback(() => {
    if (perRoute) {
      return `${storageKey}_${currentRoute}`;
    }
    return storageKey;
  }, [storageKey, perRoute, currentRoute]);

  // Load saved position from localStorage
  const loadSavedPosition = useCallback((): Position | null => {
    try {
      const saved = localStorage.getItem(getFullStorageKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load mascot position:", e);
    }
    return null;
  }, [getFullStorageKey]);

  // Clamp position to screen bounds
  const clampToScreen = useCallback((pos: Position): Position => {
    if (typeof window === "undefined") return pos;
    
    const maxX = window.innerWidth - elementSize.width - margin;
    const maxY = window.innerHeight - elementSize.height - margin;
    
    return {
      x: Math.max(margin, Math.min(pos.x, maxX)),
      y: Math.max(margin, Math.min(pos.y, maxY)),
    };
  }, [elementSize.width, elementSize.height, margin]);

  // Snap to nearest horizontal edge
  const snapToNearestEdge = useCallback((pos: Position): Position => {
    if (typeof window === "undefined") return pos;
    
    const screenCenter = window.innerWidth / 2;
    const elementCenter = pos.x + elementSize.width / 2;
    
    // Snap to left or right edge
    const snappedX = elementCenter < screenCenter
      ? margin
      : window.innerWidth - elementSize.width - margin;
    
    return {
      x: snappedX,
      y: pos.y,
    };
  }, [elementSize.width, margin]);

  // Initialize position
  const [position, setPosition] = useState<Position>(() => {
    const saved = loadSavedPosition();
    if (saved) {
      return clampToScreen(saved);
    }
    return getDefaultPosition();
  });

  const [isDragging, setIsDragging] = useState(false);
  const [wasDragged, setWasDragged] = useState(false);
  
  // Refs for drag calculation
  const startPosRef = useRef<Position>({ x: 0, y: 0 });
  const startMouseRef = useRef<Position>({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Reload position when route changes
  useEffect(() => {
    const saved = loadSavedPosition();
    if (saved) {
      setPosition(clampToScreen(saved));
    } else {
      setPosition(getDefaultPosition());
    }
  }, [currentRoute, loadSavedPosition, clampToScreen, getDefaultPosition]);

  // Handle window resize - keep in bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => clampToScreen(prev));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampToScreen]);

  // Save position to localStorage
  const savePosition = useCallback((pos: Position) => {
    try {
      localStorage.setItem(getFullStorageKey(), JSON.stringify(pos));
    } catch (e) {
      console.warn("Failed to save mascot position:", e);
    }
  }, [getFullStorageKey]);

  // Get coordinates from mouse or touch event
  const getEventCoords = (e: MouseEvent | TouchEvent): Position => {
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  // Mouse/Touch move handler
  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    
    const coords = getEventCoords(e);
    const deltaX = coords.x - startMouseRef.current.x;
    const deltaY = coords.y - startMouseRef.current.y;
    
    // Check if we've exceeded drag threshold
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > dragThreshold) {
      hasDraggedRef.current = true;
      setIsDragging(true);
    }
    
    if (hasDraggedRef.current) {
      const newPos = clampToScreen({
        x: startPosRef.current.x + deltaX,
        y: startPosRef.current.y + deltaY,
      });
      setPosition(newPos);
    }
  }, [dragThreshold, clampToScreen]);

  // Mouse/Touch end handler
  const handleEnd = useCallback(() => {
    if (hasDraggedRef.current) {
      setWasDragged(true);
      
      // Apply snap if enabled
      let finalPos = position;
      if (snapToEdge) {
        finalPos = snapToNearestEdge(position);
        setPosition(finalPos);
      }
      
      // Save final position
      savePosition(finalPos);
      
      // Reset wasDragged after a short delay
      setTimeout(() => setWasDragged(false), 100);
    }
    
    setIsDragging(false);
    hasDraggedRef.current = false;
    
    // Remove event listeners
    document.removeEventListener("mousemove", handleMove);
    document.removeEventListener("mouseup", handleEnd);
    document.removeEventListener("touchmove", handleMove);
    document.removeEventListener("touchend", handleEnd);
  }, [position, snapToEdge, snapToNearestEdge, savePosition, handleMove]);

  // Start drag handler
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Prevent text selection during drag
    e.preventDefault();
    
    const coords = "touches" in e 
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY };
    
    startPosRef.current = { ...position };
    startMouseRef.current = coords;
    hasDraggedRef.current = false;
    setWasDragged(false);
    
    // Add event listeners
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd);
  }, [position, handleMove, handleEnd]);

  // Reset position for current route
  const resetPosition = useCallback(() => {
    const defaultPos = getDefaultPosition();
    setPosition(defaultPos);
    savePosition(defaultPos);
  }, [getDefaultPosition, savePosition]);

  // Reset all saved positions
  const resetAllPositions = useCallback(() => {
    try {
      // Remove all keys that start with our storage key
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(storageKey)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Reset current position
      setPosition(getDefaultPosition());
    } catch (e) {
      console.warn("Failed to reset mascot positions:", e);
    }
  }, [storageKey, getDefaultPosition]);

  return {
    position,
    isDragging,
    wasDragged,
    handleMouseDown,
    resetPosition,
    resetAllPositions,
  };
}

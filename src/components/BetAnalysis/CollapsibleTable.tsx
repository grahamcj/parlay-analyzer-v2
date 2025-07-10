import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleTableProps {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  tableId: string;
}

export default function CollapsibleTable({ 
  title, 
  count, 
  children, 
  defaultCollapsed = false,
  tableId
}: CollapsibleTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showFloatingHeader, setShowFloatingHeader] = useState(false);
  const [floatingHeaderHTML, setFloatingHeaderHTML] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);
  const floatingHeaderRef = useRef<HTMLDivElement>(null);

  // Simple scroll-based approach
  useEffect(() => {
    if (isCollapsed) {
      setShowFloatingHeader(false);
      return;
    }

    const checkScroll = () => {
      const table = tableRef.current?.querySelector('table');
      const thead = table?.querySelector('thead');
      const tableBottom = tableRef.current?.getBoundingClientRect().bottom;
      
      if (!thead || !tableBottom) return;

      // Get the position of the thead relative to viewport
      const rect = thead.getBoundingClientRect();
      
      // Show floating header when thead starts to go under the collapsible header
      // BUT hide it if the table bottom is approaching the top of the viewport
      if (rect.top < 123 && tableBottom > 185) {
        setShowFloatingHeader(true);
        // Clone the header with computed styles
        const clonedThead = thead.cloneNode(true) as HTMLElement;
        
        // Copy column widths from original header
        const originalThs = thead.querySelectorAll('th');
        const clonedThs = clonedThead.querySelectorAll('th');
        
        originalThs.forEach((th, index) => {
          if (clonedThs[index]) {
            const width = th.getBoundingClientRect().width;
            (clonedThs[index] as HTMLElement).style.width = `${width}px`;
            (clonedThs[index] as HTMLElement).style.minWidth = `${width}px`;
            (clonedThs[index] as HTMLElement).style.maxWidth = `${width}px`;
          }
        });
        
        setFloatingHeaderHTML(clonedThead.outerHTML);
      } else {
        setShowFloatingHeader(false);
      }
    };

    // Check on scroll AND resize
    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    // Initial check
    checkScroll();

    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [isCollapsed]);

  // Sync horizontal scroll
  useEffect(() => {
    if (!showFloatingHeader) return;

    const syncScroll = () => {
      const tableContainer = tableRef.current?.querySelector('.overflow-x-auto') as HTMLDivElement;
      const floatingContainer = document.getElementById(`floating-header-${tableId}`)?.querySelector('.overflow-x-auto') as HTMLDivElement;
      
      if (tableContainer && floatingContainer) {
        floatingContainer.scrollLeft = tableContainer.scrollLeft;
      }
    };

    // Sync on table scroll
    const tableContainer = tableRef.current?.querySelector('.overflow-x-auto') as HTMLDivElement;
    if (tableContainer) {
      tableContainer.addEventListener('scroll', syncScroll);
      
      // Initial sync when floating header appears
      syncScroll();
      
      return () => tableContainer.removeEventListener('scroll', syncScroll);
    }
  }, [showFloatingHeader, tableId]);

  // Keep scroll position synced when header updates
  useEffect(() => {
    if (!showFloatingHeader || !floatingHeaderHTML) return;
    
    // After DOM update, sync scroll position immediately
    const tableContainer = tableRef.current?.querySelector('.overflow-x-auto') as HTMLDivElement;
    const floatingContainer = document.getElementById(`floating-header-${tableId}`)?.querySelector('.overflow-x-auto') as HTMLDivElement;
    
    if (tableContainer && floatingContainer) {
      // Use requestAnimationFrame for smoother sync
      requestAnimationFrame(() => {
        floatingContainer.scrollLeft = tableContainer.scrollLeft;
      });
    }
  }, [floatingHeaderHTML, showFloatingHeader, tableId]);

  // Handle clicks on floating header
  const handleFloatingHeaderClick = (e: React.MouseEvent) => {
    const th = (e.target as HTMLElement).closest('th');
    if (!th) return;

    // Preserve current scroll position before triggering sort
    const tableContainer = tableRef.current?.querySelector('.overflow-x-auto') as HTMLDivElement;
    const currentScrollLeft = tableContainer?.scrollLeft || 0;

    // Find the index of the clicked column
    const allThs = Array.from(th.parentElement?.children || []);
    const columnIndex = allThs.indexOf(th);

    // Trigger click on the real header
    const realTh = tableRef.current?.querySelectorAll('thead th')[columnIndex] as HTMLElement;
    if (realTh) {
      realTh.click();
      
      // Immediately restore scroll position after click
      requestAnimationFrame(() => {
        if (tableContainer) {
          tableContainer.scrollLeft = currentScrollLeft;
        }
        const floatingContainer = document.getElementById(`floating-header-${tableId}`)?.querySelector('.overflow-x-auto') as HTMLDivElement;
        if (floatingContainer) {
          floatingContainer.scrollLeft = currentScrollLeft;
        }
      });
    }
  };

  // Floating header component using Portal
  const FloatingHeader = () => {
    if (!showFloatingHeader || isCollapsed || !floatingHeaderHTML) return null;

    // Get the original table for measurement
    const originalTable = tableRef.current?.querySelector('table');
    const tableContainer = tableRef.current?.querySelector('.overflow-x-auto') as HTMLDivElement;
    
    // Calculate table width and scrollbar compensation
    const tableWidth = originalTable?.getBoundingClientRect().width || 0;
    const hasVerticalScrollbar = tableContainer && tableContainer.scrollHeight > tableContainer.clientHeight;
    const scrollbarWidth = hasVerticalScrollbar && tableContainer 
      ? tableContainer.offsetWidth - tableContainer.clientWidth 
      : 0;

    return createPortal(
      <div 
        id={`floating-header-${tableId}`}
        ref={floatingHeaderRef}
        style={{
          position: 'fixed',
          top: '123px',
          left: '0',
          right: '0',
          width: '100%',
          zIndex: 30,
          backgroundColor: 'rgb(3 7 18)',
        }}
        onClick={handleFloatingHeaderClick}
      >
        <div className="container mx-auto px-4">
          <div 
            className="bg-gray-900 overflow-x-auto scrollbar-hide"
            style={{ paddingRight: `${scrollbarWidth}px` }}
          >
            <table 
              className="w-full bet-table"
              style={{ width: `${tableWidth}px`, tableLayout: 'fixed' }}
            >
              <thead 
                className="bg-gray-800"
                dangerouslySetInnerHTML={{ __html: floatingHeaderHTML }}
              />
            </table>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="table-section">
      {/* Collapsible header - always visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-t-lg transition-colors sticky top-[64px] z-10"
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
          <h2 className="text-xl font-semibold">{title}</h2>
          <span className="text-sm text-gray-400">({count})</span>
        </div>
      </button>

      {/* Render floating header portal */}
      <FloatingHeader />
      
      {/* Table content */}
      <div 
        ref={tableRef}
        className={`
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-none opacity-100'}
        `}
      >
        {children}
      </div>
    </div>
  );
}
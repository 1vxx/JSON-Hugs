import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Code2 } from 'lucide-react';
import { JsonEditor } from './components/JsonEditor';
import { TreeView } from './components/TreeView';
import './components/Resizer.css';
import './App.css';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('jsonhugs_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [leftWidth, setLeftWidth] = useState<number>(50); // percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jsonhugs_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      // limit dragging range between 20% and 80%
      if (newLeftWidth > 20 && newLeftWidth < 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="app-container">
      <header className="glass-panel app-header">
        <div className="header-left">
          <Code2 size={28} className="logo-icon" />
          <h1 className="app-title">JSON Hugs</h1>
        </div>
        
        <div className="header-actions">
          <button 
            className="theme-toggle glass-panel" 
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      <main className="app-main" ref={containerRef} style={{ display: 'flex', gap: 0 }}>
        <section 
          className="editor-section glass-panel" 
          style={{ width: `calc(${leftWidth}% - 12px)`, flexShrink: 0 }}
        >
          <div className="panel-header">
            <h2>Input</h2>
          </div>
          <div className="panel-content" style={{ padding: 0 }}>
             <JsonEditor onParsed={setParsedJson} />
          </div>
        </section>

        <div className="resizer" onMouseDown={startDrag}></div>

        <section 
          className="visualization-section glass-panel"
          style={{ width: `calc(${100 - leftWidth}% - 12px)`, flexShrink: 0 }}
        >
           <div className="panel-header">
            <h2>Visualization</h2>
          </div>
          <div className="panel-content viewer-content" style={{ padding: 0 }}>
             <TreeView data={parsedJson} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

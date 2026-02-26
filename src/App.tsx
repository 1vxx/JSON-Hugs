import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Code2, Wand2, Check, Maximize2, Minimize2 } from 'lucide-react';
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
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generateTypeScript = (obj: any, interfaceName = 'GeneratedRoot'): string => {
    if (obj === null || obj === undefined) {
      return `type ${interfaceName} = any;\n`;
    }
    if (typeof obj !== 'object' || Array.isArray(obj)) {
      return `type ${interfaceName} = ${typeof obj};\n`;
    }

    let interfaceStr = `export interface ${interfaceName} {\n`;
    const subInterfaces: string[] = [];

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        const valType = typeof val;
        
        let typeAnnotation = 'any';
        if (val === null) {
          typeAnnotation = 'null';
        } else if (Array.isArray(val)) {
          if (val.length > 0) {
            const firstElementType = typeof val[0];
            if (firstElementType === 'object' && val[0] !== null) {
              const subName = key.charAt(0).toUpperCase() + key.slice(1) + 'Item';
              subInterfaces.push(generateTypeScript(val[0], subName));
              typeAnnotation = `${subName}[]`;
            } else {
              typeAnnotation = `${firstElementType}[]`;
            }
          } else {
            typeAnnotation = 'any[]';
          }
        } else if (valType === 'object') {
          const subName = key.charAt(0).toUpperCase() + key.slice(1);
          subInterfaces.push(generateTypeScript(val, subName));
          typeAnnotation = subName;
        } else {
          typeAnnotation = valType;
        }
        
        // Handle keys with spaces or special characters
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
        interfaceStr += `  ${safeKey}: ${typeAnnotation};\n`;
      }
    }
    interfaceStr += '}\n\n';
    return subInterfaces.join('') + interfaceStr;
  };

  const handleGenerateTS = () => {
    if (!parsedJson) return;
    try {
      const tsCode = generateTypeScript(parsedJson);
      navigator.clipboard.writeText(tsCode.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to generate TS interface', e);
    }
  };

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
          {parsedJson !== null && (
            <button
              className={`theme-toggle glass-panel ${copied ? 'copied' : ''}`}
              onClick={handleGenerateTS}
              aria-label="Generate TypeScript Interface"
              title="一键生成 TypeScript 接口并复制"
              style={{ color: copied ? '#4facfe' : 'var(--primary)' }}
            >
              {copied ? <Check size={20} /> : <Wand2 size={20} />}
            </button>
          )}
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
          className={`visualization-section glass-panel ${isFullscreen ? 'fullscreen' : ''}`}
          style={isFullscreen ? {} : { width: `calc(${100 - leftWidth}% - 12px)`, flexShrink: 0 }}
        >
           <div className="panel-header">
            <h2>Visualization</h2>
            <button
              className="theme-toggle"
              onClick={() => setIsFullscreen(!isFullscreen)}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              title={isFullscreen ? "退出全屏" : "全屏展示"}
              style={{ width: '32px', height: '32px' }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
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

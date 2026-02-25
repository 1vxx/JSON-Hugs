import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Maximize2, Minimize2, CodeSquare } from 'lucide-react';
import { generateCode, type LanguageType } from '../utils/codeGenerator';
import './TreeView.css';

interface TreeViewProps {
  data: unknown;
}

export const TreeView: React.FC<TreeViewProps> = ({ data }) => {
  const [expandVersion, setExpandVersion] = useState(0);
  const [defaultExpanded, setDefaultExpanded] = useState(true);

  if (data === null || data === undefined) {
    return (
      <div className="empty-tree">
        <div className="placeholder-text">Your beautiful JSON structure will be displayed here... ✨</div>
      </div>
    );
  }

  const handleExpandAll = () => {
    setDefaultExpanded(true);
    setExpandVersion((v) => v + 1);
  };

  const handleCollapseAll = () => {
    setDefaultExpanded(false);
    setExpandVersion((v) => v + 1);
  };

  const handleGenerateCode = (lang: LanguageType) => {
    let codeStr = '';
    const name = lang === 'typescript' ? 'RootStructure' 
         : lang === 'kotlin' ? 'RootData' 
         : 'RootEntity';
    codeStr = generateCode(data, name, lang);
    navigator.clipboard.writeText(codeStr);
    const langNames = { typescript: 'TypeScript', kotlin: 'Kotlin', java: 'Java' };
    alert(`${langNames[lang]} copied to clipboard! ✨`);
  };

  return (
    <div className="tree-container">
      <div className="tree-toolbar glass-panel">
        <div className="tree-title">JSON Structure</div>
        <div className="spacer"></div>
        <button className="icon-btn" onClick={handleExpandAll} title="Expand All">
          <Maximize2 size={16} />
        </button>
        <button className="icon-btn" onClick={handleCollapseAll} title="Collapse All">
          <Minimize2 size={16} />
        </button>
        <div className="lang-actions" style={{ display: 'flex', gap: '4px', marginLeft: '0.5rem', alignItems: 'center', borderLeft: '1px solid var(--panel-border)', paddingLeft: '0.5rem' }}>
          <button className="icon-btn primary-btn" onClick={() => handleGenerateCode('typescript')} title="Generate TypeScript">
            <CodeSquare size={14} /> <span style={{ fontSize: '0.75rem', fontWeight: 600, marginLeft: 2 }}>TS</span>
          </button>
          <button className="icon-btn primary-btn" onClick={() => handleGenerateCode('kotlin')} title="Generate Kotlin">
            <CodeSquare size={14} /> <span style={{ fontSize: '0.75rem', fontWeight: 600, marginLeft: 2 }}>KT</span>
          </button>
          <button className="icon-btn primary-btn" onClick={() => handleGenerateCode('java')} title="Generate Java">
            <CodeSquare size={14} /> <span style={{ fontSize: '0.75rem', fontWeight: 600, marginLeft: 2 }}>JAVA</span>
          </button>
        </div>
      </div>
      <div className="tree-content">
        <TreeNode 
          nodeKey="root" 
          value={data} 
          isRoot 
          level={0} 
          expandVersion={expandVersion}
          defaultExpanded={defaultExpanded}
        />
      </div>
    </div>
  );
};

interface TreeNodeProps {
  nodeKey: string;
  value: unknown;
  isRoot?: boolean;
  level: number;
  expandVersion: number;
  defaultExpanded: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  nodeKey, 
  value, 
  isRoot = false, 
  level,
  expandVersion,
  defaultExpanded
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [lastVersion, setLastVersion] = useState<number>(expandVersion);

  if (expandVersion !== lastVersion) {
    setIsExpanded(defaultExpanded);
    setLastVersion(expandVersion);
  }
  
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isComplex = isObject || isArray;

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const renderValue = () => {
    if (value === null) return <span className="val-null">null</span>;
    if (typeof value === 'string') return <span className="val-string">"{value}"</span>;
    if (typeof value === 'number') return <span className="val-number">{value}</span>;
    if (typeof value === 'boolean') return <span className="val-boolean">{value ? 'true' : 'false'}</span>;
    
    if (isArray) {
      if (value.length === 0) return <span>[]</span>;
      return <span className="val-complex">Array({value.length})</span>;
    }
    
    if (isObject) {
      if (Object.keys(value as object).length === 0) return <span>{}</span>;
      return <span className="val-complex">{"{...}"}</span>;
    }
    
    return <span>{String(value)}</span>;
  };

  return (
    <div className="node-wrapper" style={{ paddingLeft: isRoot ? 0 : '1.5rem' }}>
      <div className="node-line" onClick={isComplex ? toggleExpand : undefined}>
        {isComplex && (
          <span className="expand-icon">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {!isRoot && (
          <span className="node-key">
            {nodeKey}
            <span className="key-colon">:</span>
          </span>
        )}
        <span className="node-value">{isComplex && isExpanded ? (isArray ? '[' : '{') : renderValue()}</span>
      </div>

      {isComplex && isExpanded && (
        <div className="node-children">
          {isArray &&
            (value as unknown[]).map((item, index) => (
              <TreeNode
                key={index}
                nodeKey={String(index)}
                value={item}
                level={level + 1}
                expandVersion={expandVersion}
                defaultExpanded={defaultExpanded}
              />
            ))}
          {isObject &&
            Object.entries(value as Record<string, unknown>).map(([k, v]) => (
              <TreeNode
                key={k}
                nodeKey={k}
                value={v}
                level={level + 1}
                expandVersion={expandVersion}
                defaultExpanded={defaultExpanded}
              />
            ))}
        </div>
      )}
      
      {isComplex && isExpanded && (
         <div className="node-close">
           {isArray ? ']' : '}'}
         </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Play, AlignLeft, Minimize2, AlertCircle } from 'lucide-react';
import JSONbig from 'json-bigint';
import './JsonEditor.css';

interface JsonEditorProps {
  onParsed: (data: unknown) => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ onParsed }) => {
  const [inputData, setInputData] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputData(val);
    if (!val.trim()) {
      setError(null);
      onParsed(null);
      return;
    }
    try {
      const parsed = JSONbig({ useNativeBigInt: true }).parse(val);
      setError(null);
      onParsed(parsed);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid JSON');
      }
      onParsed(null);
    }
  };



  const handleFormat = () => {
    try {
      const parsed = JSONbig({ useNativeBigInt: true }).parse(inputData);
      setInputData(JSONbig.stringify(parsed, null, 2));
      setError(null);
      onParsed(parsed);
    } catch {
      setError('Cannot format invalid JSON');
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSONbig({ useNativeBigInt: true }).parse(inputData);
      setInputData(JSONbig.stringify(parsed));
      setError(null);
      onParsed(parsed);
    } catch {
      setError('Cannot minify invalid JSON');
    }
  };

  const handleDemo = () => {
    const demoJson = {
      project: "JSON Hugs",
      version: 1.0,
      isAwesome: true,
      features: ["Glassmorphism UI", "Fast Parsing", "Cute Tools"],
      creator: {
        name: "Yoi",
        mood: "Happy 😊"
      },
      nullValue: null,
      magicNumber: 42
    };
    setInputData(JSONbig.stringify(demoJson, undefined, 2));
    onParsed(demoJson);
    setError(null);
  };

  return (
    <div className="editor-container">
      <div className="editor-toolbar glass-panel">
        <button className="toolbar-btn" onClick={handleFormat} title="Format JSON" disabled={!!error && error !== 'Cannot format invalid JSON'}>
          <AlignLeft size={16} /> <span>Format</span>
        </button>
        <button className="toolbar-btn" onClick={handleMinify} title="Minify JSON" disabled={!!error && error !== 'Cannot minify invalid JSON'}>
          <Minimize2 size={16} /> <span>Minify</span>
        </button>
        <div className="spacer"></div>
        <button className="toolbar-btn primary-btn" onClick={handleDemo} title="Load Demo Data">
          <Play size={16} /> <span>Load Demo</span>
        </button>
      </div>

      <div className={`editor-wrapper ${error ? 'has-error' : ''}`}>
        <textarea
          className="json-input mono-text"
          placeholder="Paste or type your JSON here..."
          spellCheck="false"
          value={inputData}
          onChange={handleInputChange}
        />
        {error && (
          <div className="error-banner glass-panel">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

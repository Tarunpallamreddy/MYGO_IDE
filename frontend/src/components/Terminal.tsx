import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { getSocket } from '../services/api';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  terminalId: string;
}

export default function Terminal({ terminalId }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const fitAddonInstance = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 1. Create XTerm instance with custom dark developer styling
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: "Fira Code, Courier New, monospace",
      theme: {
        background: '#0c0f16',
        foreground: '#c9d1d9',
        cursor: '#06b6d4',
        selectionBackground: 'rgba(59, 130, 246, 0.3)',
        black: '#000000',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#8b5cf6',
        cyan: '#06b6d4',
        white: '#ffffff',
      },
      convertEol: true
    });

    // 2. Load Fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // 3. Mount terminal
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    fitAddonInstance.current = fitAddon;

    // 4. Connect WebSockets
    const socket = getSocket();
    
    // Create new shell process on backend
    socket.emit('terminal_create', { terminal_id: terminalId, cols: term.cols, rows: term.rows });

    // Handle incoming terminal outputs
    const outputListener = (payload: { terminal_id: string; data: string }) => {
      if (payload.terminal_id === terminalId) {
        term.write(payload.data);
      }
    };
    socket.on('terminal_output', outputListener);

    // Handle keyboard inputs
    const dataDisposable = term.onData((data) => {
      socket.emit('terminal_input', { terminal_id: terminalId, data });
    });

    // Handle resizing
    const resizeHandler = () => {
      if (fitAddonInstance.current) {
        try {
          fitAddonInstance.current.fit();
          socket.emit('terminal_resize', {
            terminal_id: terminalId,
            cols: term.cols,
            rows: term.rows
          });
        } catch (e) {
          // Suppress errors during quick drag animations
        }
      }
    };

    window.addEventListener('resize', resizeHandler);

    // Dynamic element observer to handle panel dragging
    const resizeObserver = new ResizeObserver(() => {
      resizeHandler();
    });
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    // Initial resize trigger after load
    setTimeout(resizeHandler, 100);

    // 5. Cleanup
    return () => {
      window.removeEventListener('resize', resizeHandler);
      resizeObserver.disconnect();
      dataDisposable.dispose();
      socket.off('terminal_output', outputListener);
      socket.emit('terminal_close', { terminal_id: terminalId });
      term.dispose();
    };
  }, [terminalId]);

  return (
    <div className="w-full h-full bg-[#0c0f16] overflow-hidden">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}

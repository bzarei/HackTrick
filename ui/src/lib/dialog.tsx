import ReactDOM from 'react-dom';
import { useState, useEffect, useRef, ComponentType, ReactNode } from 'react';

import { Translator } from '@novx/i18n';
import { ShortcutManager } from './shortcut-manager';
import { CommandInterceptor } from './command';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ButtonConfiguration<T = any> {
  label?: string;
  i18n?: string;
  primary?: boolean;
  result?: T;
  shortcut?: string;
}

export interface AbstractDialogConfig<T = any> {
  title?: string;
  buttons: ButtonConfiguration<T>[];
}

export interface DialogConfig<T = any> extends AbstractDialogConfig<T> {
  message?: string;
  icon?: 'info' | 'warn' | 'error';
}

export interface InputDialogConfig<T = any> extends AbstractDialogConfig<T> {
  message?: string;
  placeholder?: string;
  inputType?: 'text' | 'number' | 'email' | 'password';
  required?: boolean;
  defaultValue?: any;
  icon?: 'info' | 'warn' | 'error';
}

export interface DynamicDialogConfig<T = any> extends AbstractDialogConfig<T> {
  component: ComponentType<any>;
  arguments?: any;
}

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

interface TooltipProps {
  children: ReactNode;
  text: string;
}

const Tooltip = ({ children, text }: TooltipProps) => {
  const [visible, setVisible] = useState(false);

  if (!text) return <>{children}</>;

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <>
          <style>
            {`
              @keyframes tooltipFadeIn {
                from {
                  opacity: 0;
                  transform: translateX(-50%) translateY(-2px);
                }
                to {
                  opacity: 1;
                  transform: translateX(-50%) translateY(0);
                }
              }
            `}
          </style>
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '6px 10px',
              background: 'rgba(0, 0, 0, 0.9)',
              color: '#fff',
              fontSize: '12px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 10000,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              animation: 'tooltipFadeIn 0.15s ease-out',
            }}
          >
            {text}
            {/* Arrow */}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid rgba(0, 0, 0, 0.9)',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// ABSTRACT DIALOG BUILDER
// ============================================================================

export abstract class AbstractDialogBuilder<TConfig extends AbstractDialogConfig, TResult = any> {
  protected config: TConfig;

  constructor(
    config: TConfig,
    protected translator?: Translator
  ) {
    this.config = config;
  }

  title(title: string): this {
    this.config.title = title;
    return this;
  }

  button(button: ButtonConfiguration<TResult>): this {
    this.config.buttons.push(button);
    return this;
  }

  ok(label = 'OK', result: TResult = true as any): this {
    return this.button({ label, primary: true, result, shortcut: 'enter' });
  }

  cancel(label = 'Cancel', result: TResult = undefined as any): this {
    return this.button({ label, result, shortcut: 'escape' });
  }

  okCancel(okLabel = 'OK', cancelLabel = 'Cancel'): this {
    return this.ok(okLabel).cancel(cancelLabel);
  }

  abstract show(): Promise<any>;

  protected createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    document.body.appendChild(container);
    return container;
  }

  protected cleanup(container: HTMLDivElement): void {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  }
}

// ============================================================================
// DIALOG BUILDER
// ============================================================================

export class DialogBuilder<T = any> extends AbstractDialogBuilder<DialogConfig<T>, T> {
  constructor(translator?: Translator) {
    super({ buttons: [] }, translator);
  }

  message(msg: string): this {
    this.config.message = msg;
    return this;
  }

  icon(icon: 'info' | 'warn' | 'error'): this {
    this.config.icon = icon;
    return this;
  }

  show(): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve) => {
      const container = this.createContainer();

      const handleClose = (result: T | undefined) => {
        this.cleanup(container);
        resolve(result);
      };

      ReactDOM.render(
        <DialogComponent 
          config={this.config} 
          onClose={handleClose}
          translator={this.translator}
        />,
        container
      );
    });
  }
}

// ============================================================================
// INPUT DIALOG BUILDER
// ============================================================================

export class InputDialogBuilder<T = any> extends AbstractDialogBuilder<InputDialogConfig<T>, T> {
  constructor(translator?: Translator) {
    super(
      {
        title: '',
        message: '',
        placeholder: '',
        inputType: 'text',
        required: true,
        defaultValue: '',
        buttons: [],
      },
      translator
    );
  }

  message(message: string): this {
    this.config.message = message;
    return this;
  }

  placeholder(placeholder: string): this {
    this.config.placeholder = placeholder;
    return this;
  }

  inputType(type: 'text' | 'number' | 'email' | 'password'): this {
    this.config.inputType = type;
    return this;
  }

  defaultValue(value: any): this {
    this.config.defaultValue = value;
    return this;
  }

  required(required: boolean = true): this {
    this.config.required = required;
    return this;
  }

  icon(icon: 'info' | 'warn' | 'error'): this {
    this.config.icon = icon;
    return this;
  }

  ok(): this {
    return this.button({
      i18n: 'portal.commands:ok',
      primary: true,
      result: true as any,
      shortcut: 'enter',
    });
  }

  okCancel(): this {
    return this.button({
      i18n: 'portal.commands:ok',
      primary: true,
      result: true as any,
      shortcut: 'enter',
    }).button({
      i18n: 'portal.commands:cancel',
      result: undefined,
      shortcut: 'escape',
    });
  }

  show(): Promise<{ value: any; button: T | undefined }> {
    return new Promise((resolve) => {
      const container = this.createContainer();

      const handleClose = (result: { value: any; button: T | undefined }) => {
        this.cleanup(container);
        resolve(result);
      };

      ReactDOM.render(
        <InputDialogComponent 
          config={this.config} 
          onClose={handleClose}
          translator={this.translator}
        />,
        container
      );
    });
  }
}

// ============================================================================
// DYNAMIC DIALOG BUILDER
// ============================================================================

export class DynamicDialogBuilder<T = any> extends AbstractDialogBuilder<DynamicDialogConfig<T>, T> {
  constructor(translator?: Translator) {
    super(
      {
        title: '',
        component: () => <div>No component specified</div>,
        buttons: [],
      },
      translator
    );
  }

  component(component: ComponentType<any>): this {
    this.config.component = component;
    return this;
  }

  args(args: any): this {
    this.config.arguments = args;
    return this;
  }

  show(): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve) => {
      const container = this.createContainer();

      const handleClose = (result: T | undefined) => {
        this.cleanup(container);
        resolve(result);
      };

      ReactDOM.render(
        <DynamicDialogComponent 
          config={this.config} 
          onClose={handleClose}
          translator={this.translator}
        />,
        container
      );
    });
  }
}

// ============================================================================
// DIALOG OVERLAY WRAPPER (with shortcut layer management)
// ============================================================================

interface DialogOverlayProps {
  children: ReactNode;
  onBackdropClick?: () => void;
  buttons: ButtonConfiguration[];
  onButtonClick: (result: any) => void;
}

const DialogOverlay = ({ children, onBackdropClick, buttons, onButtonClick }: DialogOverlayProps) => {
  const shortcutManagerRef = useRef<ShortcutManager | null>(null);

  useEffect(() => {
    const manager = new ShortcutManager();
    shortcutManagerRef.current = manager;
    manager.pushLayer();

    buttons.forEach((btn) => {
      if (btn.shortcut) {
        manager.registerCommand({
          shortcut: btn.shortcut,
          state: { enabled: true, running: false },
          run: async () => onButtonClick(btn.result),
          name: '',
          label: '',
          runFn: function (): void | Promise<void> {
            throw new Error('Function not implemented.');
          },
          interceptors: [],
          addInterceptor: function (interceptor: CommandInterceptor): void {
            throw new Error('Function not implemented.');
          },
          setEnabled: function (enabled: boolean): void {
            throw new Error('Function not implemented.');
          },
          setRunning: function (running: boolean): void {
            throw new Error('Function not implemented.');
          }
        });
      }
    });

    return () => {
      manager.popLayer();
    };
  }, [buttons, onButtonClick]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onBackdropClick) {
          onBackdropClick();
        }
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
      {children}
    </div>
  );
};

// ============================================================================
// DIALOG COMPONENT
// ============================================================================

interface DialogProps<T = any> {
  config: DialogConfig<T>;
  onClose: (result: T | undefined) => void;
  translator?: Translator;
}

export const DialogComponent = <T,>({ config, onClose, translator }: DialogProps<T>) => {
  const { title, message, buttons, icon } = config;

  const resolveButtonLabel = (btn: ButtonConfiguration<T>): string => {
    if (btn.label) return btn.label;
    if (btn.i18n && translator) return translator.translate(btn.i18n);
    return 'Button';
  };

  const formatShortcut = (shortcut?: string): string => {
    if (!shortcut) return '';
    return shortcut
      .split('+')
      .map(k => k.charAt(0).toUpperCase() + k.slice(1))
      .join('+');
  };

  return (
    <DialogOverlay
      buttons={buttons}
      onButtonClick={onClose}
      onBackdropClick={() => onClose(undefined)}
    >
      <div
        style={{
          background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
          borderRadius: '16px',
          minWidth: '320px',
          maxWidth: '90%',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with icon and title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          {icon && renderIcon(icon)}
          {title && (
            <h2
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '600',
                color: '#1a1a1a',
                letterSpacing: '-0.5px',
                flex: 1,
              }}
            >
              {title}
            </h2>
          )}
        </div>

        {message && (
          <p
            style={{
              margin: '0',
              fontSize: '15px',
              lineHeight: '1.6',
              color: '#4a5568',
            }}
          >
            {message}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '28px',
          }}
        >
          {buttons.map((b, i) => (
            <Tooltip key={i} text={b.shortcut ? formatShortcut(b.shortcut) : ''}>
              <button
                onClick={() => onClose(b.result)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  border: b.primary ? 'none' : '1px solid #d1d5db',
                  background: b.primary
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : '#ffffff',
                  color: b.primary ? '#ffffff' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: b.primary
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                    : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  minWidth: '80px',
                }}
                onMouseEnter={(e) => {
                  if (b.primary) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                  } else {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (b.primary) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  } else {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = b.primary ? 'translateY(-1px)' : 'scale(1)';
                }}
              >
                {resolveButtonLabel(b)}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
    </DialogOverlay>
  );
};

// ============================================================================
// INPUT DIALOG COMPONENT
// ============================================================================

interface InputDialogProps<T = any> {
  config: InputDialogConfig<T>;
  onClose: (result: { value: any; button: T | undefined }) => void;
  translator?: Translator;
}

export const InputDialogComponent = <T,>({ config, onClose, translator }: InputDialogProps<T>) => {
  const { title, message, buttons, icon, placeholder, inputType, required, defaultValue } = config;
  const [inputValue, setInputValue] = useState(defaultValue ?? '');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleButtonClick = (btn: ButtonConfiguration<T>) => {
    if (btn.primary && required && !inputValue) {
      setError('This field is required');
      return;
    }

    const value = inputType === 'number' ? parseFloat(inputValue) : inputValue;
    onClose({ value: btn.result ? value : undefined, button: btn.result });
  };

  const resolveButtonLabel = (btn: ButtonConfiguration<T>): string => {
    if (btn.label) return btn.label;
    if (btn.i18n && translator) return translator.translate(btn.i18n);
    return 'Button';
  };

  const formatShortcut = (shortcut?: string): string => {
    if (!shortcut) return '';
    return shortcut
      .split('+')
      .map(k => k.charAt(0).toUpperCase() + k.slice(1))
      .join('+');
  };

  return (
    <DialogOverlay
      buttons={buttons}
      onButtonClick={handleButtonClick}
      onBackdropClick={() => onClose({ value: undefined, button: undefined })}
    >
      <div
        style={{
          background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
          borderRadius: '16px',
          minWidth: '400px',
          maxWidth: '90%',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with icon and title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          {icon && renderIcon(icon)}
          {title && (
            <h2
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '600',
                color: '#1a1a1a',
                letterSpacing: '-0.5px',
                flex: 1,
              }}
            >
              {title}
            </h2>
          )}
        </div>

        {message && (
          <p
            style={{
              margin: '0 0 20px 0',
              fontSize: '15px',
              lineHeight: '1.6',
              color: '#4a5568',
            }}
          >
            {message}
          </p>
        )}

        <div style={{ marginBottom: '8px' }}>
          <input
            ref={inputRef}
            type={inputType}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: error ? '2px solid #ef4444' : '1px solid #d1d5db',
              fontSize: '15px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
              background: '#ffffff',
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.border = '2px solid #3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.border = '1px solid #d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          />
          {error && (
            <div
              style={{
                marginTop: '8px',
                fontSize: '13px',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
          }}
        >
          {buttons.map((b, i) => (
            <Tooltip key={i} text={b.shortcut ? formatShortcut(b.shortcut) : ''}>
              <button
                onClick={() => handleButtonClick(b)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  border: b.primary ? 'none' : '1px solid #d1d5db',
                  background: b.primary
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : '#ffffff',
                  color: b.primary ? '#ffffff' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: b.primary
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                    : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  minWidth: '80px',
                }}
                onMouseEnter={(e) => {
                  if (b.primary) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                  } else {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (b.primary) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  } else {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = b.primary ? 'translateY(-1px)' : 'scale(1)';
                }}
              >
                {resolveButtonLabel(b)}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
    </DialogOverlay>
  );
};

// ============================================================================
// DYNAMIC DIALOG COMPONENT
// ============================================================================

interface DynamicDialogProps<T = any> {
  config: DynamicDialogConfig<T>;
  onClose: (result: T | undefined) => void;
  translator?: Translator;
}

export const DynamicDialogComponent = <T,>({ config, onClose, translator }: DynamicDialogProps<T>) => {
  const { title, buttons, component: Component, arguments: args } = config;

  const resolveButtonLabel = (btn: ButtonConfiguration<T>): string => {
    if (btn.label) return btn.label;
    if (btn.i18n && translator) return translator.translate(btn.i18n);
    return 'Button';
  };

  const formatShortcut = (shortcut?: string): string => {
    if (!shortcut) return '';
    return shortcut
      .split('+')
      .map(k => k.charAt(0).toUpperCase() + k.slice(1))
      .join('+');
  };

  return (
    <DialogOverlay
      buttons={buttons}
      onButtonClick={onClose}
      onBackdropClick={() => onClose(undefined)}
    >
      <div
        style={{
          background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
          borderRadius: '16px',
          minWidth: '400px',
          maxWidth: '90%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            style={{
              padding: '24px 32px',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '600',
                color: '#1a1a1a',
                letterSpacing: '-0.5px',
              }}
            >
              {title}
            </h2>
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '32px',
          }}
        >
          <Component {...args} onClose={onClose} />
        </div>

        {buttons.length > 0 && (
          <div
            style={{
              padding: '16px 32px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            {buttons.map((b, i) => (
              <Tooltip key={i} text={b.shortcut ? formatShortcut(b.shortcut) : ''}>
                <button
                  onClick={() => onClose(b.result)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    border: b.primary ? 'none' : '1px solid #d1d5db',
                    background: b.primary
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                      : '#ffffff',
                    color: b.primary ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: b.primary
                      ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                      : '0 1px 3px rgba(0, 0, 0, 0.1)',
                    minWidth: '80px',
                  }}
                  onMouseEnter={(e) => {
                    if (b.primary) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                    } else {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (b.primary) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                    } else {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = b.primary ? 'translateY(-1px)' : 'scale(1)';
                  }}
                >
                  {resolveButtonLabel(b)}
                </button>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </DialogOverlay>
  );
};

// ============================================================================
// ICON RENDERER
// ============================================================================

function renderIcon(icon: 'info' | 'warn' | 'error') {
  const iconStyles = {
    info: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: '#ffffff',
    },
    warn: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: '#ffffff',
    },
    error: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#ffffff',
    },
  };

  const style = iconStyles[icon];

  return (
    <div
      style={{
        width: '48px',
        height: '48px',
        minWidth: '48px',
        borderRadius: '50%',
        background: style.background,
        color: style.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      }}
    >
      {icon === 'info' && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )}
      {icon === 'warn' && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )}
      {icon === 'error' && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )}
    </div>
  );
}
/**
 * WebSocket Event Client for subscribing to server-side events
 *
 * Usage:
 * ```typescript
 * const client = new EventWebSocketClient('ws://localhost:8000/ws/events/client-123');
 *
 * client.on('connected', () => {
 *   console.log('Connected to server');
 *   client.subscribe('HelloEvent', (data) => {
 *     console.log('Received HelloEvent:', data);
 *   });
 * });
 *
 * client.connect();
 * ```
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface EventMessage {
  type: 'event';
  event_name: string;
  data: any;
  timestamp: string;
}

export interface SubscribeResponse {
  type: 'subscribe_response';
  event_name: string;
  success: boolean;
}

export interface UnsubscribeResponse {
  type: 'unsubscribe_response';
  event_name: string;
  success: boolean;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export interface PongMessage {
  type: 'pong';
}

export type ServerMessage =
  | EventMessage
  | SubscribeResponse
  | UnsubscribeResponse
  | ErrorMessage
  | PongMessage;

export type EventCallback<T = any> = (data: T) => void;

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface EventWebSocketOptions {
  /**
   * Automatically reconnect on disconnect
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Reconnection delay in milliseconds
   * @default 1000
   */
  reconnectDelay?: number;

  /**
   * Maximum reconnection attempts (0 = infinite)
   * @default 0
   */
  maxReconnectAttempts?: number;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Ping interval in milliseconds (0 = disabled)
   * @default 30000
   */
  pingInterval?: number;
}

// ============================================================================
// EventWebSocketClient
// ============================================================================

export class EventWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private options: Required<EventWebSocketOptions>;
  private state: ConnectionState = 'disconnected';

  // Event subscriptions: event_name -> Set<callback>
  private eventSubscriptions = new Map<string, Set<EventCallback>>();

  // Server-acknowledged subscriptions
  private activeSubscriptions = new Set<string>();

  // Lifecycle callbacks
  private lifecycleCallbacks = new Map<string, Set<() => void>>();

  // Reconnection state
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(url: string, options: EventWebSocketOptions = {}) {
    this.url = url;
    this.options = {
      autoReconnect: options.autoReconnect ?? true,
      reconnectDelay: options.reconnectDelay ?? 1000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 0,
      debug: options.debug ?? false,
      pingInterval: options.pingInterval ?? 30000,
    };
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.ws && (this.state === 'connected' || this.state === 'connecting')) {
      this.log('Already connected or connecting');
      return;
    }

    this.state = 'connecting';
    this.log(`Connecting to ${this.url}`);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      this.log('Connection error:', error);
      this.handleConnectionFailure();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.options.autoReconnect = false; // Disable auto-reconnect
    this.clearReconnectTimer();
    this.clearPingTimer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.state = 'disconnected';
    this.activeSubscriptions.clear();
    this.emit('disconnected');
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  // ============================================================================
  // Event Subscription
  // ============================================================================

  /**
   * Subscribe to an event
   * @param eventName - Name of the event to subscribe to
   * @param callback - Callback to invoke when event is received
   * @returns Unsubscribe function
   */
  subscribe<T = any>(eventName: string, callback: EventCallback<T>): () => void {
    // Add callback to local subscriptions
    if (!this.eventSubscriptions.has(eventName)) {
      this.eventSubscriptions.set(eventName, new Set());
    }
    this.eventSubscriptions.get(eventName)!.add(callback);

    // Request server subscription if connected
    if (this.isConnected() && !this.activeSubscriptions.has(eventName)) {
      this.sendSubscribe(eventName);
    }

    // Return unsubscribe function
    return () => this.unsubscribeCallback(eventName, callback);
  }

  /**
   * Unsubscribe from an event
   * @param eventName - Name of the event to unsubscribe from
   */
  unsubscribe(eventName: string): void {
    this.eventSubscriptions.delete(eventName);

    if (this.isConnected() && this.activeSubscriptions.has(eventName)) {
      this.sendUnsubscribe(eventName);
    }
  }

  /**
   * Unsubscribe a specific callback from an event
   */
  private unsubscribeCallback(eventName: string, callback: EventCallback): void {
    const callbacks = this.eventSubscriptions.get(eventName);
    if (callbacks) {
      callbacks.delete(callback);

      // If no more callbacks, unsubscribe from server
      if (callbacks.size === 0) {
        this.unsubscribe(eventName);
      }
    }
  }

  // ============================================================================
  // Lifecycle Events
  // ============================================================================

  /**
   * Register a lifecycle event callback
   * @param event - Lifecycle event: 'connected', 'disconnected', 'reconnecting', 'error'
   * @param callback - Callback to invoke
   * @returns Unregister function
   */
  on(event: 'connected' | 'disconnected' | 'reconnecting' | 'error', callback: () => void): () => void {
    if (!this.lifecycleCallbacks.has(event)) {
      this.lifecycleCallbacks.set(event, new Set());
    }
    this.lifecycleCallbacks.get(event)!.add(callback);

    return () => {
      this.lifecycleCallbacks.get(event)?.delete(callback);
    };
  }

  /**
   * Emit a lifecycle event
   */
  private emit(event: string): void {
    const callbacks = this.lifecycleCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb();
        } catch (error) {
          this.log(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  // ============================================================================
  // WebSocket Event Handlers
  // ============================================================================

  private handleOpen(): void {
    this.log('WebSocket connected');
    this.state = 'connected';
    this.reconnectAttempts = 0;

    // Start ping timer
    this.startPingTimer();

    // Re-subscribe to all events
    this.resubscribeAll();

    this.emit('connected');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: ServerMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'event':
          this.handleEventMessage(message);
          break;

        case 'subscribe_response':
          this.handleSubscribeResponse(message);
          break;

        case 'unsubscribe_response':
          this.handleUnsubscribeResponse(message);
          break;

        case 'error':
          this.log('Server error:', message.message);
          break;

        case 'pong':
          this.log('Received pong');
          break;

        default:
          this.log('Unknown message type:', message);
      }
    } catch (error) {
      this.log('Failed to parse message:', error);
    }
  }

  private handleError(event: Event): void {
    this.log('WebSocket error:', event);
    this.emit('error');
  }

  private handleClose(event: CloseEvent): void {
    this.log(`WebSocket closed: ${event.code} ${event.reason}`);
    this.state = 'disconnected';
    this.clearPingTimer();
    this.activeSubscriptions.clear();

    this.emit('disconnected');

    // Attempt reconnection if enabled
    if (this.options.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  // ============================================================================
  // Message Handlers
  // ============================================================================

  private handleEventMessage(message: EventMessage): void {
    const callbacks = this.eventSubscriptions.get(message.event_name);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message.data);
        } catch (error) {
          this.log(`Error in event callback for ${message.event_name}:`, error);
        }
      });
    }
  }

  private handleSubscribeResponse(message: SubscribeResponse): void {
    if (message.success) {
      this.activeSubscriptions.add(message.event_name);
      this.log(`Successfully subscribed to ${message.event_name}`);
    } else {
      this.log(`Failed to subscribe to ${message.event_name}`);
    }
  }

  private handleUnsubscribeResponse(message: UnsubscribeResponse): void {
    if (message.success) {
      this.activeSubscriptions.delete(message.event_name);
      this.log(`Successfully unsubscribed from ${message.event_name}`);
    } else {
      this.log(`Failed to unsubscribe from ${message.event_name}`);
    }
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  private sendSubscribe(eventName: string): void {
    this.send({
      type: 'subscribe',
      event_name: eventName,
    });
  }

  private sendUnsubscribe(eventName: string): void {
    this.send({
      type: 'unsubscribe',
      event_name: eventName,
    });
  }

  private resubscribeAll(): void {
    this.log('Resubscribing to all events');
    this.eventSubscriptions.forEach((_, eventName) => {
      this.sendSubscribe(eventName);
    });
  }

  // ============================================================================
  // Reconnection Logic
  // ============================================================================

  private scheduleReconnect(): void {
    if (
      this.options.maxReconnectAttempts > 0 &&
      this.reconnectAttempts >= this.options.maxReconnectAttempts
    ) {
      this.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.state = 'reconnecting';
    this.emit('reconnecting');

    const delay = this.options.reconnectDelay * Math.min(this.reconnectAttempts, 10);
    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleConnectionFailure(): void {
    this.state = 'disconnected';
    this.emit('error');

    if (this.options.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  // ============================================================================
  // Ping/Pong
  // ============================================================================

  private startPingTimer(): void {
    if (this.options.pingInterval > 0) {
      this.pingTimer = setInterval(() => {
        if (this.isConnected()) {
          this.send({ type: 'ping' });
        }
      }, this.options.pingInterval);
    }
  }

  private clearPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private send(message: any): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
    } else {
      this.log('Cannot send message: not connected');
    }
  }

  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[EventWebSocketClient]', ...args);
    }
  }

  /**
   * Get list of active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.activeSubscriptions);
  }

  /**
   * Get list of local subscriptions (may not be active on server yet)
   */
  getLocalSubscriptions(): string[] {
    return Array.from(this.eventSubscriptions.keys());
  }
}

// ============================================================================
// React Hooks (Optional)
// ============================================================================

/**
 * React hook for using EventWebSocketClient
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const client = useEventWebSocket('ws://localhost:8000/ws/events/client-123');
 *
 *   useEventSubscription(client, 'HelloEvent', (data) => {
 *     console.log('Received:', data);
 *   });
 *
 *   return <div>Connected: {client?.isConnected()}</div>;
 * }
 * ```
 */
export function useEventWebSocket(
  url: string,
  options?: EventWebSocketOptions
): EventWebSocketClient | null {
  // Check if React is available
  if (typeof window !== 'undefined' && (window as any).React) {
    const React = (window as any).React;
    const { useState, useEffect } = React;

    // @ts-expect-error: dunno    
    const [client, setClient] = useState<EventWebSocketClient | null>(null);
    const [connected, setConnected] = useState(false);

    console.log(connected)

    useEffect(() => {
      const wsClient = new EventWebSocketClient(url, options);

      wsClient.on('connected', () => setConnected(true));
      wsClient.on('disconnected', () => setConnected(false));

      wsClient.connect();
      setClient(wsClient);

      return () => {
        wsClient.disconnect();
      };
    }, [url]);

    return client;
  }

  return null;
}

/**
 * React hook for subscribing to events
 *
 * Usage:
 * ```tsx
 * useEventSubscription(client, 'HelloEvent', (data) => {
 *   console.log('Received:', data);
 * }, [dependencies]);
 * ```
 */
export function useEventSubscription<T = any>(
  client: EventWebSocketClient | null,
  eventName: string,
  callback: EventCallback<T>,
  deps: any[] = []
): void {
  if (typeof window !== 'undefined' && (window as any).React) {
    const React = (window as any).React;
    const { useEffect } = React;

    useEffect(() => {
      if (!client) return;

      const unsubscribe = client.subscribe(eventName, callback);
      return unsubscribe;
    }, [client, eventName, ...deps]);
  }
}

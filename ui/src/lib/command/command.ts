export type CommandInterceptor = (
  cmd: Command,
  next: () => Promise<void>,
) => Promise<void>;

export type InitialCommand = {
  name: string;
  label: string;
  shortcut?: string;
  run: () => void | Promise<void>;
  enabled?: boolean;
};

export type CommandState = {
  running: boolean;
  enabled: boolean;
};

export class Command {
  name: string;
  label: string;
  shortcut?: string;
  runFn: () => void | Promise<void>;
  state: CommandState;
  interceptors: CommandInterceptor[];

  constructor(initial: InitialCommand) {
    this.name = initial.name;
    this.label = initial.label;
    this.shortcut = initial.shortcut;
    this.runFn = initial.run;
    this.state = { enabled: initial.enabled ?? true, running: false };
    this.interceptors = [];
  }

  addInterceptor(interceptor: CommandInterceptor) {
    this.interceptors.push(interceptor);
  }

  async run() {
    const chain = [...this.interceptors];

    const execute = async () => {
      const result = this.runFn();
      if (result instanceof Promise) await result;
    };

    const runChain = async (index: number) => {
      if (index >= chain.length) return execute();
      await chain[index](this, () => runChain(index + 1));
    };

    await runChain(0);
  }

  setEnabled(enabled: boolean) {
    this.state.enabled = enabled;
  }

  setRunning(running: boolean) {
    this.state.running = running;
  }
}

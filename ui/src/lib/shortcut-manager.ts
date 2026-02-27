// shortcut-manager.ts
import { injectable } from '@novx/core';
import { Command } from './command';


type ShortcutEntry = { key: string; command: Command };

@injectable()
export class ShortcutManager {
  private layers: ShortcutEntry[][] = [];

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  pushLayer() {
    this.layers.push([]);
  }

  popLayer() {
    this.layers.pop();
  }

  registerCommand(cmd: Command) {
    if (!cmd.shortcut) return;
    if (this.layers.length === 0) this.pushLayer();
    this.layers[this.layers.length - 1].push({
      key: cmd.shortcut.toLowerCase(),
      command: cmd,
    });
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.layers.length === 0) return;

    const topLayer = this.layers[this.layers.length - 1];
    const keyCombo = this.formatKey(e);
    const entry = topLayer.find((en) => en.key === keyCombo);

    if (entry && entry.command.state.enabled && !entry.command.state.running) {
      e.preventDefault();
      entry.command.run();
    }
  };

  private formatKey(e: KeyboardEvent) {
    const keys = [];
    if (e.ctrlKey) keys.push('ctrl');
    if (e.shiftKey) keys.push('shift');
    if (e.altKey) keys.push('alt');
    keys.push(e.key.toLowerCase());
    return keys.join('+');
  }
}

export const shortcutManager = new ShortcutManager();

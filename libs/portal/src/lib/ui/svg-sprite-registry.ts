import { injectable } from '@novx/core';


@injectable()
export class SvgSpriteRegistry {
  private registered = new Set<string>();
  mounted = false

 async registerAll(namespace: string, context: __WebpackModuleApi.RequireContext) {
     if (this.mounted) return;

     const defsEl = document.querySelector('#__svg-sprite defs');
     if (!defsEl) throw new Error('SVG sprite <defs> not found');

     for (const key of context.keys()) {
       const svgContent = await context(key); // raw string
       defsEl.innerHTML += svgContent;
     }

     this.mounted = true;
   }

  register(id: string, symbolSource: string) {
    console.log("### register svg " + id);

    if (this.registered.has(id)) return;

    const sprite = document.getElementById('__svg-sprite');
    if (!sprite) throw new Error('SVG sprite container not found');

    const defs = sprite.querySelector('defs')!;
    const template = document.createElement('template');

    template.innerHTML = symbolSource.trim();
    const symbol = template.content.firstElementChild as SVGSymbolElement;

    if (!symbol /*|| symbol.tagName !== 'symbol' || symbol.tagName !== 'SYMBOL'*/) {
      console.log(`SVG "${id}" must export a <symbol>`);

      return;
    }

    symbol.setAttribute('id', id);
    defs.appendChild(symbol);

    this.registered.add(id);
  }
}


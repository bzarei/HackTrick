export function isDefined(value: any): boolean {
  // eslint-disable-next-line no-constant-binary-expression, valid-typeof
  return typeof value !== undefined && value !== null;
}

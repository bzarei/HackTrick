// src/type-reflection.spec.ts
import 'reflect-metadata';

// Dummy decorator — needed for metadata to be emitted
function dummy(): MethodDecorator & PropertyDecorator & ClassDecorator {
  return () => {
      // noop
  };
}

@dummy()
class TestClass {
  constructor(public name: string, public age: number) {}

  @dummy()
  greet(msg: string, times: number): boolean {
    console.log(msg.repeat(times));
    return true;
  }
}

describe('Reflect metadata', () => {
  it('should get constructor param types', () => {
    const ctorParams = Reflect.getMetadata('design:paramtypes', TestClass);
    expect(ctorParams).toBeDefined();
    expect(ctorParams.length).toBe(2);
    expect(ctorParams[0]).toBe(String);
    expect(ctorParams[1]).toBe(Number);
  });

  it('should get method param types and return type', () => {
    const methodParams = Reflect.getMetadata(
      'design:paramtypes',
      TestClass.prototype,
      'greet'
    );
    const returnType = Reflect.getMetadata(
      'design:returntype',
      TestClass.prototype,
      'greet'
    );

    expect(methodParams).toBeDefined();
    expect(methodParams.length).toBe(2);
    expect(methodParams[0]).toBe(String);
    expect(methodParams[1]).toBe(Number);

    expect(returnType).toBe(Boolean);
  });
});

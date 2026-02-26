import React from 'react';

import { injectable, module, Environment, Module } from '@novx/core';
import { Feature } from '@novx/portal';

@injectable()
class Foo {}

@module()
class ApplicationModule extends Module {}

const environment = new Environment({module: ApplicationModule})
const foo = environment.get(Foo)

@Feature({
  id: "hello",
  label: "hello",
  path: "/hello",
  icon: "shell:add",
  description: "hello",
  tags: ["menu"],
  permissions: [],
  features: [],
  visibility: ["private", "public"]
})
class HelloFeature extends React.Component {
  render() {
    return <div>
      HELLO
    </div>;
  }
}

export default function App() {
  return (
    <div>
      <h1>Hello Nx + React App (Webpack)</h1>
      <HelloFeature></HelloFeature>
    </div>
  );
}
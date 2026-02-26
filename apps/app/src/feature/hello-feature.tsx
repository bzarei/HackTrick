import React from 'react';

import {  Feature } from '@novx/portal';

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

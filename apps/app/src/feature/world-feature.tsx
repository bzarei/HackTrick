import React from 'react';

import {  Feature } from '@novx/portal';

@Feature({
  id: "world",
  label: "world",
  path: "/world",
  icon: "shell:add",
  description: "world",
  tags: ["menu"],
  permissions: [],
  features: [],
  visibility: ["private", "public"]
})
class HelloFeature extends React.Component {
  render() {
    return <div  style={{
        fontSize: '32px',
        fontWeight: 'bold',
        margin: '24px',
        textAlign: 'center'
      }}>
      WORLD
    </div>;
  }
}

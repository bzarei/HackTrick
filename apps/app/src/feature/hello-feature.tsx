import React from 'react';

import {  EnvironmentContext, Feature, useI18N } from '@novx/portal';
import { Environment } from '@novx/core';
import { Translator } from '@novx/i18n';

@Feature({
  id: "hello",
  i18n: "hello",
  path: "/hello",
  icon: "shell:add",
  description: "hello",
  tags: ["menu"],
  permissions: [],
  features: [],
  visibility: ["private", "public"]
})
class HelloFeature extends React.Component {
  static contextType = EnvironmentContext;
  declare context: Environment;

  render() {
    const translator = this.context.get(Translator)

   

    return <div  style={{
        fontSize: '32px',
        fontWeight: 'bold',
        margin: '24px',
        textAlign: 'center'
      }}>
      {translator.translate("portal:hello.label")}
    </div>;
  }
}

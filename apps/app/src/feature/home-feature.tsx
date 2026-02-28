import React from "react";

import {  Feature } from '@novx/portal';


const styles = {
  container: { padding: 20, textAlign: 'center' },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 18, color: '#666' },
  button: { marginTop: 20, padding: '10px 20px', fontSize: 16 },
};

@Feature({
  id: "home",
  i18n: "home",
  path: "/",
  icon: "shell:add",
  description: "home",
  tags: [""],
  permissions: [],
  features: [],
  visibility: ["private", "public"]
})
export class HomePage extends React.Component {
  render() {
     return <div  style={{
            fontSize: '32px',
            fontWeight: 'bold',
            margin: '24px',
            textAlign: 'center'
          }}>
          HOME SWEET HOME
        </div>;
  }
}
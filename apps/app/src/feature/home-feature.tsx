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
  label: "home",
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
    return (
      <main>
        <h1 style={styles.title}>Welcome to NovX</h1>
        <p style={styles.subtitle}>
          Your microfrontend is up and running 🚀
        </p>
        <button style={styles.button} onClick={() => alert("Hello!")}>
          Get Started
        </button>
      </main>
    );
  }
}
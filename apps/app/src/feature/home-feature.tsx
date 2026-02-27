import React from "react";

import {  Feature } from '@novx/portal';

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
export const HomePage: React.FC = () => {
  return (
    <main style={styles.container}>
      <h1 style={styles.title}>Welcome to NovX</h1>
      <p style={styles.subtitle}>
        Your microfrontend is up and running 🚀
      </p>
      <button style={styles.button} onClick={() => alert("Hello!")}>
        Get Started
      </button>
    </main>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f5f7fa",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "1rem",
  },
  subtitle: {
    fontSize: "1.2rem",
    marginBottom: "2rem",
    color: "#555",
  },
  button: {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    cursor: "pointer",
  },
};
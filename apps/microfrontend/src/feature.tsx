import React from "react";
import { Feature } from "@novx/portal";

@Feature({
  id: "feature",
  label: "microfrontend",
  icon: "shell:chat",
  description: "feature page",
  path: "/microfrontend/feature",
  tags: ["menu"],
  permissions: [],
  features: [],
  visibility: ["public"],
})
class MicrofrontendFeature extends React.Component {
  render() {
    return (
      <div  style={{
        fontSize: '32px',
        fontWeight: 'bold',
        margin: '24px',
        textAlign: 'center'
      }}>
          This is the microfrontend feature page.
      </div>
    );
  }
}

export default MicrofrontendFeature;

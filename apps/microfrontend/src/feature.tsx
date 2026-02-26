import React from "react";
import { Feature } from "@novx/portal";

@Feature({
  id: "feature",
  label: "feature Page",
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
      <div>
        <p style={{ color: '#a0a0a0', lineHeight: '1.6' }}>
          This is the microfrontend feature page.
        </p>
      </div>
    );
  }
}

export default MicrofrontendFeature;

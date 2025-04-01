
import React from "react";
import Settings from "./Settings";
import { Helmet } from "react-helmet";

// SettingsPage is a wrapper around the existing Settings page
const SettingsPage = () => {
  return (
    <>
      <Helmet>
        <title>Configurações - Escolha e Configure os Modelos de IA</title>
        <meta name="description" content="Configure seus modelos de IA preferidos, incluindo GPT-4o, GPT-4o Mini e GPT-3.5 Turbo para geração de histórias e ilustrações." />
      </Helmet>
      <Settings />
    </>
  );
};

export default SettingsPage;

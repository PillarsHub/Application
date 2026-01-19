import React from "react";
import PropTypes from "prop-types";
import CodeMirror from "@uiw/react-codemirror";
import { basicSetup } from "@uiw/codemirror-extensions-basic-setup";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";

const CodeEditor = ({ name, value, mode = "htmlmixed", onChange }) => {
  const extensions = mode === "css" ? [basicSetup(), css()] : [basicSetup(), html()];

  return (
    <CodeMirror
      value={value ?? ""}
      height="300px"
      extensions={extensions}
      onChange={(val) => onChange(name, val)}
    />
  );
};

CodeEditor.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  mode: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default CodeEditor;

import React, { useRef } from 'react';
import { Editor as MCE } from '@tinymce/tinymce-react';
import PropTypes from 'prop-types';


const Editor = ({ name, value, height = 300, mode = "simple", onChange }) => {
  const editorRef = useRef(null);

  const handleChange = () => {
    let value = editorRef.current.getContent();
    onChange(name, value);
  };

  let simple = (mode == 'simple' || mode == 'tiny');
  let toolbar = mode == 'tiny' ?
    'undo bold italic | alignleft aligncenter alignright | link image emoticons mergetags | bullist numlist outdent indent | code removeformat' :
    'undo redo | styles | bold italic forecolor | alignleft aligncenter alignright | link image emoticons mergetags | bullist numlist outdent indent | code removeformat'

  return <>
    <MCE
      tinymceScriptSrc={'/lib/tinymce/tinymce.min.js'}
      onInit={(evt, editor) => editorRef.current = editor}
      onEditorChange={handleChange}
      name={name}
      value={value ?? ''}
      init={{
        height: height,
        menubar: !simple,
        statusbar: !simple,
        promotion: false,
        branding: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
        ],
        toolbar: toolbar,
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        object_resizing: false,
        formats: {
          calltoaction: {
            selector: "a",
            styles: {
              backgroundColor: "#335dff",
              padding: "12px 16px",
              color: "#ffffff",
              borderRadius: "4px",
              textDecoration: "none",
              display: "inline-block"
            }
          }
        },
        style_formats: [
          { title: "Paragraph", format: "p" },
          { title: "Heading 1", format: "h1" },
          { title: "Heading 2", format: "h2" },
          { title: "Heading 3", format: "h3" },
          { title: "Heading 4", format: "h4" },
          { title: "Button styles" },
          { title: "Call-to-action", format: "calltoaction" }
        ],
      }}
    />
  </>
}

export default Editor;

Editor.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  height: PropTypes.number,
  mode: PropTypes.string,
  onChange: PropTypes.func,
}
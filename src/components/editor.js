import React, { useRef } from 'react';
import { Editor as MCE } from '@tinymce/tinymce-react';
import PropTypes from 'prop-types';


const Editor = ( { name, value, height = 300, mode = "simple", onChange } ) => {
    const editorRef = useRef(null);
  
    const handleChange = () => {
        let value = editorRef.current.getContent();
        onChange(name, value);
    };

    let simple = mode == 'simple';

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
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
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
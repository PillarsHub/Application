import React, { useEffect } from "react";
import PropTypes from 'prop-types';
import TextInput from "../../../components/textInput.jsx";
import CheckBox from "../../../components/checkbox.jsx";



const UplineContent = ({ widget, updateWidget, trees }) => {

  useEffect(() => {
    if (trees) {
      updateWidget((v) => {
        trees?.map((tree) => {
          var index = v.panes?.findIndex(p => p.title == tree.name) ?? -1;
          if (index == -1) {
            if (!v.panes) v.panes = [];
            v.panes.push({ title: tree.name, text: `${tree.name} Upline`, imageUrl: "true" });
          }
        })

        return { ...v }
      });
    }
  }, [trees])

  const handleChange = (name, value) => {
    updateWidget((v) => {

      var index = v.panes?.findIndex(p => p.title == name) ?? -1;
      v.panes[index].text = value;

      return { ...v };
    })
  }

  const handleChangeChecked = (name, value) => {
    updateWidget((v) => {

      var index = v.panes?.findIndex(p => p.title == name) ?? -1;
      v.panes[index].imageUrl = `${value}`;

      return { ...v };
    })
  }

  return <>
    <div className="row row-cards">

      {widget.panes && widget.panes.map((pane) => {
        return <React.Fragment key={pane.title}>
          <div className="col-md-4">
            <label className="form-label">{pane.title} Upline Label</label>
            <div className="input-group mb-2">
              <span className="input-group-text">
                <CheckBox name={pane.title} value={pane?.imageUrl?.toLowerCase() == 'true'} onChange={handleChangeChecked} placeholder="Name of the Wedget" />
              </span>
              <TextInput name={pane.title} value={pane?.text} onChange={handleChange} placeholder="Name of the Wedget" />
            </div>
          </div>
        </React.Fragment>
      })}
    </div>
  </>
}

export default UplineContent;

UplineContent.propTypes = {
  widget: PropTypes.any.isRequired,
  updateWidget: PropTypes.func.isRequired,
  trees: PropTypes.any.isRequired
}
import React, { useState } from "react";
import PropTypes from 'prop-types';
import Modal from "../../../components/modal";
import TextInput from '../../../components/textInput';
import SelectInput from '../../../components/selectInput';
import ColorInput from "../../../components/colorInput";
import TextArea from "../../../components/textArea";
import Switch from "../../../components/switch";

const CardContent = ({ widget, definitions, updateWidget }) => {
  const [showEdit, setShowEdit] = useState();
  const [showDelete, setShowDelete] = useState();
  const [editItem, setEditItem] = useState();

  const handleDeleteHide = () => setShowDelete(false);
  const handleShowDelete = (index) => {
    setEditItem({ ...widget?.panes[index], index: index });
    setShowDelete(true);
  }
  const handleDelete = () => {
    updateWidget((v) => {
      v.panes.splice(editItem.index, 1);
      return { ...v }
    });
    setShowDelete(false);
  }

  const handleHideEdit = () => setShowEdit(false);
  const handleShowEdit = (index) => {
    if (index > -1) {
      setEditItem({ ...widget?.panes[index], index: index, linkType: "LF" });
    } else {
      setEditItem({ index: index, linkType: "UL" });
    }
    setShowEdit(true);
  }

  const handleSaveEdit = () => {
    updateWidget((v) => {
      if (editItem.index == -1) {
        if (!v.panes) v.panes = [];
        v.panes.push(editItem);
      } else {
        v.panes[editItem.index] = editItem;
      }

      return { ...v }
    });
    setShowEdit(false);
  }

  const handleTermChange = (name, value) => {
    let foundDefinition = null;
    let rankValues = null;
    definitions && definitions.some((plan) => {
      return plan.definitions && plan.definitions.some((definition) => {
        if (definition.valueId === value) {
          foundDefinition = definition;
          return true;
        }
        return false;
      });
    });

    if (!foundDefinition && (value.toLowerCase() == "rank" || value.toLowerCase() == "highrank")) {
      foundDefinition = {
        name: "Current Rank",
        valueId: "Rank",
        comment: "Your rank shows your standing in our direct sales organization. It’s based on your sales, team growth, and contributions. A higher rank means better performance and more recognition."
      }
      rankValues = definitions.find(item => item.ranks?.length > 0).ranks.map((rank) => { return { value: rank.id, text: rank.name } });
    }

    if (!foundDefinition) {
      foundDefinition = {
        name: value,
        valueId: "",
        comment: ""
      }
    }


    setEditItem((v) => ({
      ...v,
      title: value,
      text: `${foundDefinition?.name} (${foundDefinition?.valueId})`,
      description: foundDefinition?.comment,
      values: rankValues
    }));
  }

  const handleValuesToggle = (name, value) => {
    setEditItem((prev) => {
      let newValues = null;

      if (value) {
        if (prev.title.toLowerCase() === "rank" || prev.title.toLowerCase() === "highrank") {
          const definition = definitions.find(item => item.ranks?.length > 0);
          newValues = definition
            ? definition.ranks.map(rank => ({ value: rank.id, text: rank.name }))
            : [];
        } else {
          newValues = [{ value: 0, text: "False" }, { value: 1, text: "True" }];
        }
      }

      return {
        ...prev,
        values: newValues
      };
    });
  };

  const handleSlideChange = (name, value) => {
    setEditItem((v) => ({ ...v, [name]: value }));
  }

  const handleWidgetChange = (name, value) => {
    updateWidget((v) => ({ ...v, [name]: value }));
  }

  const handleWidgetSettingsChange = (name, value) => {
    updateWidget((v) => ({
      ...v,
      settings: {
        ...v.settings,
        [name]: value,
      },
    }));
  };

  return <>
    <div className="mb-2 border-bottom">
      <Switch name="showDatePicker" value={widget?.showDatePicker} title="Enable Date Selector" onChange={handleWidgetChange} />
      <Switch name="pageDatePicker" value={widget?.settings?.['pageDatePicker']} title="Date affects all page widgets" onChange={handleWidgetSettingsChange} />
    </div>

    <div className="mb-2 border-bottom">
      <Switch name="customer" value={widget?.settings?.['customer']} title="Customer Name" onChange={handleWidgetSettingsChange} />
    </div>

    <div className="mb-3 border-bottom">
      <Switch name="compact" value={widget?.settings?.['compact']} title="Compact View" onChange={handleWidgetSettingsChange} />
    </div>

    <div className="row row-deck row-cards">
      {widget?.panes && widget.panes.map((p, index) => {
        return <div key={p.id} className="col-sm-6 col-lg-4">
          <div className="card card bg-primary-lt card-sm">
            <div className="card-body pt-2">
              <div className="d-flex align-items-center">
                <div className="col">
                  <div>{p.title}</div>
                  <div className="text-muted">{p.text}</div>
                </div>
                <div className="col-auto">
                  <div className="dropdown">
                    <a href="#" className="btn-action" data-bs-toggle="dropdown" aria-expanded="false">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle></svg>
                    </a>
                    <div className="dropdown-menu dropdown-menu-end">
                      <button className="dropdown-item" onClick={() => handleShowEdit(index)} >Edit</button>
                      <button className="dropdown-item text-danger" onClick={() => handleShowDelete(index)} >Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      })}

      <button className="btn btn-default" onClick={() => handleShowEdit(-1)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-photo-plus" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M15 8h.01"></path><path d="M12.5 21h-6.5a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6.5"></path><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l4 4"></path><path d="M14 14l1 -1c.67 -.644 1.45 -.824 2.182 -.54"></path><path d="M16 19h6"></path><path d="M19 16v6"></path></svg>
        Add Commission Value
      </button>

    </div>
    <Modal showModal={showEdit} onHide={handleHideEdit}>
      <div className="modal-header">
        <h5 className="modal-title">Term Details</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-12 mb-3">
            <label className="form-label">Source Term</label>
            <SelectInput name="title" value={editItem?.title} emptyOption="-- Please select --" onChange={handleTermChange}>
              <optgroup label="Customer Values">
                <option value="CustType">Customer Type</option>
                <option value="Status">Status</option>
                <option value="Email">Email</option>
                <option value="Handle">Handle</option>
                <option value="EnrollDate">Enroll Date</option>
                <option value="Phone">Phone</option>
              </optgroup>
              <optgroup label="Commission Values">
                <option value="Rank">Rank</option>
                <option value="HighRank">Highest Rank</option>
                {definitions && definitions.map((plan) => {
                  return (plan.definitions && plan.definitions.map((definition) => {
                    return <option key={`${plan.id}_${definition.valueId}`} value={definition.valueId}>{definition.name} ({definition.valueId})</option>
                  }))
                })}
              </optgroup>
            </SelectInput>
          </div>
          <div className="col-12 mb-3">
            <label className="form-label">Title</label>
            <TextInput name="text" value={editItem?.text ?? ''} onChange={handleSlideChange} />
          </div>

          <div className="col-12 mb-3">
            <label className="form-label">Description</label>
            <TextArea name="description" value={editItem?.description ?? ''} onChange={handleSlideChange} />
          </div>

          <div className="col-12 mb-3">
            <Switch title="Use value mapping" value={editItem?.values != null} onChange={handleValuesToggle} />

            {editItem?.values != null && <>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Value</th>
                    <th>Display Text</th>
                  </tr>
                </thead>
                <tbody>
                  {editItem?.values && editItem.values.map((value) => {
                    return <tr key={value.value}>
                      <td>{value.value}</td>
                      <td>{value.text}</td>
                    </tr>
                  })}
                </tbody>
              </table>

            </>}

          </div>

          <div className="col-12 mb-3">
            <label className="form-label">Color</label>
            <div className="input-group">
              <ColorInput name="imageUrl" value={editItem?.imageUrl} defaultValue={widget.textColor} onChange={handleSlideChange} />
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-primary ms-auto" onClick={handleSaveEdit}>
          Save
        </button>
      </div>
    </Modal>

    <Modal showModal={showDelete} size="sm" onHide={handleDeleteHide}>
      <div className="modal-body">
        <div className="modal-title">Are you sure?</div>
        <div>If you proceed, you will lose pane settings.</div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Pane</button>
      </div>
    </Modal>
  </>
}

export default CardContent;

CardContent.propTypes = {
  widget: PropTypes.any.isRequired,
  definitions: PropTypes.any.isRequired,
  updateWidget: PropTypes.func.isRequired
}
import React, { useState, useEffect } from 'react';
import PageHeader from "../../components/pageHeader.jsx";
import { Get } from "../../hooks/useFetch.js";
import { SendRequest } from "../../hooks/usePost.js";
import Modal from "../../components/modal.jsx";
import LocalDate from '../../util/LocalDate.jsx';
import DateTimeInput from '../../components/dateTimeInput.jsx';
import TextInput from '../../components/textInput.jsx';
import Editor from '../../components/editor.jsx';

const Schedule = () => {
  const currentDate = new Date(Date.now());
  const [showDelete, setShowDelete] = useState();
  const [show, setShow] = useState(false);
  const [selectedDate, setDate] = useState(currentDate);
  const [events, setEvents] = useState([]);
  const [activeItem, setActiveItem] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    handleFetch();
  }, [selectedDate]);

  const handleFetch = () => {
    setEvents([]);
    var firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    var lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    Get('/api/v1/Appointments?begin=' + firstDay.toISOString() + '&end=' + lastDay.toISOString() + '&offset=0&count=500', (data) => {
      setEvents(data.map((d) => { return { ...d, date: new Date(Date.parse(d.beginTime)), end: new Date(Date.parse(d.endTime)) } }));
    }, (error) => {
      alert(error);
    });
  }

  const handleToday = () => {
    setDate(new Date());
  }

  const handleNext = () => {
    setDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)));
  }

  const handleLast = () => {
    setDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)));
  }

  const handleChange = (name, value) => {
    setErrors({});
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleClose = () => setShow(false);
  const handleShow = (item) => {
    setErrors({});
    setActiveItem(item);
    setShow(true);
  }

  const handleDeleteHide = () => setShowDelete(false);
  const handleShowDelete = (item) => {
    setActiveItem(item);
    setShowDelete(true);
  }

  const handleDelete = () => {
    SendRequest("DELETE", '/api/v1/Appointments/' + activeItem.id, {}, () => {
      handleFetch();
      setShowDelete(false);
    }, (error, code) => {
      alert(code + ": " + error);
    })

  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    var hadError = false;

    if (!activeItem.name) {
      setErrors(v => ({ ...v, name: 'Event Name is required' }));
      hadError = true;
    }

    if (!activeItem.beginTime) {
      setErrors(v => ({ ...v, beginTime: 'Begin Time is required' }));
      hadError = true;
    }

    if (!activeItem.endTime) {
      setErrors(v => ({ ...v, endTime: 'End Time is required' }));
      hadError = true;
    }

    if (!hadError) {
      var item = {
        ...activeItem,
        beginTime: new Date(Date.parse(activeItem.beginTime)).toISOString(),
        endTime: new Date(Date.parse(activeItem.endTime)).toISOString(),
      }

      SendRequest("POST", '/api/v1/Appointments', item, () => {
        handleFetch();
        setShow(false);
      }, (error, code) => {
        if (code == 400) {
          const errorObject = JSON.parse(error);
          setErrors(v => ({ ...v, name: errorObject.Name, address1: errorObject.Address1, address2: errorObject.Address2 }));
        } else {
          alert(error);
        }
      })
    }
  }

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return <>
    <PageHeader title="Calendar">
      <div className="container-xl">
        <div className="row g-4">

          <div className="col-12">
            <div className="card">
              <div className="card-body border-bottom py-3">
                <div className="row g-2 align-items-center">
                  <div className="col-auto">
                    <button className="btn btn-default" onClick={() => handleShow({})}>
                      Add Event
                    </button>
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-default ms-3" onClick={handleToday}>
                      Today
                    </button>
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-icon text-reset" onClick={handleLast}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-chevron-left" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M15 6l-6 6l6 6"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-icon text-reset" onClick={handleNext}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-chevron-right" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M9 6l6 6l-6 6"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="col">
                    <h2 className="mt-2 ms-3" >{months[selectedDate.getMonth()]} {selectedDate.getFullYear()}</h2>
                  </div>

                </div>
              </div>
              <div className="table-responsive">
                <table className="table card-table table-vcenter text-nowrap">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Address 1</th>
                      <th>Address 2</th>
                      <th>Begin Time</th>
                      <th>End Time</th>
                      <th className="w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {events && events.sort((a, b) => (a.beginTime > b.beginTime) ? 1 : -1).map((event) => {
                      return <tr key={event.id}>
                        <td>{event.name}</td>
                        <td>{event.address1}</td>
                        <td>{event.address2}</td>
                        <td><LocalDate dateString={event.beginTime} /></td>
                        <td><LocalDate dateString={event.endTime} /></td>
                        <td className="text-end">
                          <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleShow(event)} >
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                          </button>

                          <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleShowDelete(event)} >
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                          </button>
                        </td>
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>

    <Modal showModal={showDelete} size="sm" onHide={handleDeleteHide}>
      <div className="modal-body">
        <div className="modal-title">Are you sure?</div>
        <div>Do you wish to delete &apos;<em>{activeItem.name}&apos;</em>?</div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Widget</button>
      </div>
    </Modal>

    <Modal showModal={show} size="lg" focus={false} onHide={handleClose}>
      <form className="dropzone" id="dropzone-default" action="./" autoComplete="off" noValidate onSubmit={handleSubmit}>
        <div className="modal-header">
          <h5 className="modal-title">Add Event</h5>
          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div className="modal-body">
          <div className="row">
            <div className="col-md-12">
              <div className="mb-3">
                <label className="form-label">Event Name</label>
                <TextInput errorText={errors.name} name="name" value={activeItem.name || ""} onChange={handleChange} />
                <span className="text-danger"></span>
              </div>
            </div>
            <div className="col-md-12">
              <div className="mb-3">
                <label className="form-label">Address</label>
                <TextInput errorText={errors.address1} name="address1" value={activeItem.address1 || ""} onChange={handleChange} />
                <span className="text-danger"></span>
              </div>
            </div>
            <div className="col-md-12">
              <div className="mb-3">
                <TextInput errorText={errors.address2} name="address2" value={activeItem.address2 || ""} onChange={handleChange} />
                <span className="text-danger"></span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Begin Time</label>
                <DateTimeInput errorText={errors.beginTime} name="beginTime" value={activeItem.beginTime} onChange={handleChange} />
                <span className="text-danger"></span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">End Time</label>
                <DateTimeInput name="endTime" errorText={errors.endTime} value={activeItem.endTime} onChange={handleChange} />
                <span className="text-danger"></span>
              </div>
            </div>
            <div className="col-12">
              <div className="mb-3">
                <Editor name="content" mode="tiny" errorText={errors.content} value={activeItem.content} onChange={handleChange}/>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
            Cancel
          </a>
          <button type="submit" className="btn btn-primary ms-auto">
            Save Event
          </button>
        </div>
      </form>
    </Modal>
  </>
}

export default Schedule;
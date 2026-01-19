import React, { useEffect, useState } from "react";
//import { useQuery, gql } from "@apollo/client";
import PageHeader, { CardHeader } from "../../components/pageHeader";
//import { useFetch } from "../../hooks/useFetch"
import { SendRequest } from "../../hooks/usePost";
import DataLoading from "../../components/dataLoading";
import LocalDate from "../../util/LocalDate";
import Modal from "../../components/modal";
import AutoComplete from "../../components/autocomplete";
import TextArea from "../../components/textArea";
import SelectInput from "../../components/selectInput";
import DateInput from "../../components/dateInput";
import PeriodPicker from "../../components/periodPicker";
import EmptyContent from "../../components/emptyContent";
import DataError from "../../components/dataError";
import AddPayableModal from "../commissions/payableComponents/addPayableModal";

/* var GET_DATA = gql`query ( $date: Date!) {
  compensationPlans(first: 1) {
    periods(date: $date) {
      id
      begin
      end
      status
    }
  }
}`; */

const Adjustments = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const [periodId, setPeriodId] = useState(Number(queryParams.get("periodId") ?? "0"));
  const [customerId, setCustomerId] = useState('');
  const [data, setData] = useState();
  const [loading] = useState();
  const [error] = useState();
  //const { data, loading, error, refetch } = useFetch(`/api/v1/CompensationPlans/0/Periods/${periodId}/HistoricalValues?offset=0&count=1000`);


  //const dateOnly = isoDate.split('T')[0];
  const [rData, setRData] = useState();
  /*  const { data: qData, loading: qLoading, error: qError } = useQuery(GET_DATA, {
     variables: { date: dateOnly },
   }); */

  useEffect(() => {
    if (periodId) {
      setData();
    }
  }, [periodId])

  useEffect(() => {
    if (data) {
      setRData([{ id: '1', nodeId: 'ABC', type: 'Manual Bonus', value: '432.43', date: '2024-01-15T23:42:23.4342Z' },
      { id: '1', nodeId: 'ABC', type: 'Manual Bonus', value: '432.43', date: '2024-02-15T23:42:23.4342Z' },
      { id: '1', nodeId: 'ABC', type: 'CV', value: '432.43', date: '2024-02-15T23:42:23.4342Z' },
      { id: '1', nodeId: 'ZYX', type: 'Rank', value: 'Team Lead', date: '2024-01-15T23:42:23.4342Z' },
      { id: '1', nodeId: 'ZYX', type: 'Manual Bonus', value: '432.43', date: '2024-01-15T23:42:23.4342Z' },
      { id: '1', nodeId: 'Susan Jones', type: 'Manual Bonus', value: '432.43', date: '2024-01-15T23:42:23.4342Z' },
      { id: '1', nodeId: 'Adam T', type: 'Manual Bonus', value: '432.43', date: '2024-01-15T23:42:23.4342Z' },
      { id: '1', nodeId: 'Morgan A', type: 'Manual Bonus', value: '432.43', date: '2024-01-15T23:42:23.4342Z' }
      ]);
    }
  }, [data])

  const [show, setShow] = useState(false);
  const [activeItem, setActiveItem] = useState({});

  if (loading) return <DataLoading />
  if (error) return <DataError error={error} />

  const handleSearch = async (name, value) => {
    setCustomerId(value && value != '' ? value : null);
  }

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault();

    if (!activeItem.key) { alert("Volume is required"); return; }
    if (!activeItem.nodeId) { alert("Customer is required"); return; }
    if (!activeItem.value) { alert("Value is required"); return; }
    if (!activeItem.periodId) { alert("Period is required"); return; }

    setShow(false);

    let item = {
      key: activeItem.key,
      periodId: activeItem.periodId,
      nodeId: activeItem.nodeId,
      sumValue: activeItem.value
    }

    var url = "/api/v1/historicalValues";
    var method = "POST";

    SendRequest(method, url, item, () => {
      //refetch();
    }, (error, code) => {
      alert(`${code}: ${error}`);
    });
  }

  const handleClose = () => setShow(false);
  const handleShow = (id) => {
    var item = data.find(element => element.id == id);
    if (item === undefined) item = { isNew: true };
    setActiveItem(item);
    setShow(true);
  }

  const handleSetPeriod = (value) => {
    setPeriodId(Number(value))
  }

  const handleRefetch = () => {

  }

  const showConst = true;

  if (showConst) {
    return <PageHeader title="Adjustments">
      <EmptyContent />
    </PageHeader>
  }

  let options = {
    hideTime: true,
    hideEnd: true,
    tabbedUI: true
  }

  return <PageHeader title="Adjustments">
    <CardHeader>
      <div className="d-flex align-items-center gap-2">

        <button className="btn btn-default" onClick={() => handleShow('')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-playlist-add" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M19 8h-14" /><path d="M5 12h9" /><path d="M11 16h-6" /><path d="M15 16h6" /><path d="M18 13v6" /></svg>
          Add Override
        </button>
        <AddPayableModal refetch={handleRefetch} />
      </div>
    </CardHeader>
    <div className="container-xl">
      <div className="row row-cards">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body border-bottom py-3">
              <div className="row g-2 align-items-center">
                <div className="col-sm-auto">
                  <PeriodPicker periodId={periodId} setPeriodId={handleSetPeriod} options={options} />
                </div>
                <div className="col-sm">
                  <div className="w-100">
                    <AutoComplete onChange={handleSearch} placeholder="Search Adjustments" value={customerId} allowNull={true} showClear={true} />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="table-responsive">
                <table className="table card-table table-vcenter text-nowrap datatable">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Customer Id</th>
                      <th>Adjustment Type</th>
                      <th>Term / Comment</th>
                      <th>Amount</th>
                      <th>Period</th>
                      <th className="w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Amanda Jones</td>
                      <td>12335</td>
                      <td>Override</td>
                      <td>RANK</td>
                      <td>Team Elite</td>
                      <td>October 1 2025</td>
                    </tr>
                    <tr>
                      <td>Amanda Jones</td>
                      <td>12335</td>
                      <td>Payable</td>
                      <td>Missing Bonus for Last month</td>
                      <td>$245.33</td>
                      <td>October 1 2025</td>
                    </tr>
                    {rData && rData.map((adj) => {
                      return <tr key={adj.id}>
                        <td>{adj.nodeId}</td>
                        <td>{adj.type}</td>
                        <td>{adj.value}</td>
                        <td><LocalDate dateString={adj.date} hideTime={true} /></td>
                        <td>
                          <button type="submit" className="btn btn-ghost-secondary btn-icon" >
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                          </button>
                          <button className="btn btn-ghost-secondary btn-icon" >
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
    </div>

    <Modal showModal={show} onHide={handleClose} >
      <div className="modal-header">
        <h5 className="modal-title">Add Adjustment</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Adjustment Type</label>
              <SelectInput name="key" value={activeItem.key} emptyOption="Select Option" onChange={handleChange}>
                <option value="RLR">Manual Bonus</option>
                <option value="RLR">Rank</option>
                <option value="CV">CV</option>
                <option value="PV">PV</option>
                <option value="LLR">Left Leg Rollover</option>

              </SelectInput>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label required">Customer</label>
              <AutoComplete name="nodeId" onChange={handleChange} />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label required">Comments</label>
              <TextArea />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Amount</label>
              <div className="input-group mb-2">
                <span className="input-group-text">
                  $
                </span>
                <input className="form-control" name="value" value={activeItem.value || ""} onChange={(e) => handleChange(e.target.name, e.target.value)} />
              </div>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Begin Date</label>
              <DateInput />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">End Date</label>
              <DateInput />
              <span className="text-danger"></span>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button className="btn btn-primary ms-auto" onClick={handleSubmit}>
          Save Adjustment
        </button>
      </div>
    </Modal>

  </PageHeader>
}

export default Adjustments;
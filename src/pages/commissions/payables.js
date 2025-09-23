import React, { useState, useEffect } from 'react';
import PageHeader, { CardHeader } from "../../components/pageHeader";
import PayablesModal from './payablesModal';
import AutoComplete from '../../components/autocomplete';
import DateTimeInput from '../../components/dateTimeInput';
import AddPayableModal from './payableComponents/addPayableModal';
import PayableSummaryPanel from './payableComponents/payableSummaryPanel';
import CustomerPayablePanel from './payableComponents/customerPayablePanel';
import BonusPayablePanel from './payableComponents/bonusPayablePanel';
import DataLoading from '../../components/dataLoading';

const PaymentHistory = () => {
  const [show, setShow] = useState(false);
  const [currentDate, setCurrentDate] = useState();
  const [customerId, setCustomerId] = useState('');
  const [currentBonus, setCurrentBonus] = useState('');
  const [pageVariables, setPageVariables] = useState({ offset: 0, count: 10 });

  const [currentBatch, setCurrentBatch] = useState({ totalCustomers: 0, forfeitTotal: 0, total: 0 });

  useEffect(() => {
    const value = new Date(Date.now());
    value.setHours(23, 59, 59);
    setCurrentDate(value.toISOString());
  }, []);

  const handlePeriodChange = (name, value) => {
    setCurrentDate(value);
  }

  const handleViewBonus = (bonus) => {
    setPageVariables({ offset: 0, count: 10 });
    setCurrentBonus(bonus);
  }

  const handleSearch = async (name, value) => {
    setCustomerId(value && value != '' ? value : null);
  }

  const handleRefetch = () => {
    //Do nothing
  }

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return <>
    <PageHeader title="Commission Payables">
      <CardHeader>
        <AddPayableModal setCurrentBatch={setCurrentBatch} refetch={handleRefetch} />
      </CardHeader>
      <div className="container-xl">

        <div className="row row-cards">

          <div className="col-xl-9">
            <div className="card">
              <div className="card-body border-bottom py-3">
                <div className="row g-2 align-items-center">
                  <div className="col-sm-auto">
                    <DateTimeInput name="currentDate" value={currentDate} onChange={handlePeriodChange} />
                  </div>
                  <div className="col-sm">
                    <div className="w-100">
                      <AutoComplete placeholder="Search Payables" value={customerId} allowNull={true} showClear={true} onChange={handleSearch} />
                    </div>
                  </div>
                  <div className="col-sm-auto">

                  </div>
                </div>
              </div>

              {customerId && <>
                <CustomerPayablePanel date={currentDate} customerId={customerId} setCurrentBatch={setCurrentBatch} />
              </>}

              {!customerId && currentBonus && <>
                <BonusPayablePanel date={currentDate} currentBonus={currentBonus} setCurrentBatch={setCurrentBatch}
                  handleViewBonus={handleViewBonus} pageVariables={pageVariables} setPageVariables={setPageVariables} handleViewCustomer={(id) => handleSearch(null, id)}
                />
              </>}

              {!customerId && !currentBonus && currentDate && <>
                <PayableSummaryPanel date={currentDate} setCurrentBatch={setCurrentBatch} handleViewBonus={handleViewBonus} />
              </>}

            </div>
          </div>

          <div className="col-xl-3">
            <div className="card">
              {!currentBatch && <>
                <DataLoading />
              </>}
              {currentBatch && <>
                <div className="card-header d-none d-sm-block">
                  <h3 className="card-title">Payable Summary</h3>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <p className="mb-2 text-muted">Customers</p>
                    <p className="mb-2 text-muted">{currentBatch.totalCustomers}</p>
                  </div>
                  <div className="d-flex justify-content-between">
                    <p className="mb-2 text-muted">Forfeited</p>
                    <p className="mb-2 text-muted">{currentBatch.forfeitTotal.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}</p>
                  </div>
                  <div className="d-flex justify-content-between">
                    <p className="mb-2">Release Total</p>
                    <p className="mb-2 fw-bold">{currentBatch.total.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}</p>
                  </div>
                  <div className="mt-3 ms-auto">
                    {currentBatch.forfeitTotal == 0 && currentBatch.total == 0 && <>
                      <button className="btn btn-success mb-2 w-100" disabled={true} > Process Payables </button>
                    </>}
                    {(currentBatch.forfeitTotal != 0 || currentBatch.total != 0) && <>
                      <button className="btn btn-success mb-2 w-100" onClick={handleShow} > Process Payables </button>
                    </>}
                  </div>
                  {/* {JSON.stringify(currentBatch)} */}
                </div>
              </>}
            </div>
          </div>

        </div>
      </div>
    </PageHeader >

    <PayablesModal showModal={show} onHide={handleClose} batchData={currentBatch} />


  </>
}

export default PaymentHistory;
import React, { useState } from 'react';
import { useParams } from "react-router-dom"
import { useFetch } from '../../../hooks/useFetch.js'
import DataLoading from "../../components/dataLoading.jsx"
import DataError from "../../components/dataError.jsx"
import Modal from "../../components/modal.jsx"
import LocalDate from "../../util/LocalDate.jsx";
import PageHeader from '../../../components/pageHeader.jsx';

const WebHookLogs = () => {
  const params = useParams();
  const [activeItem, setActiveItem] = useState();
  const { loading, error, data } = useFetch(`/api/v1/WebHooks/${params.environmentId}/Messages?offset=0&count=100&subscriptionId=${params.subscriptionId}`);

  const handleHide = () => setActiveItem();

  if (loading || !data) return <DataLoading />;
  if (error) return < DataError message={error} />;

  return <>
    <PageHeader title="Webhook Logs" breadcrumbs={[{ title: "Environments", link: "/account/environments" }, { title: "Environment", link: `/account/environments/${params.environmentId}` }, { title: "Webhook Logs" }]} >
      <div className="page-body">
        <div className="container-xl">
          <div className="row row-cards row-deck">
            <div className="col-12">
              <div className="card">
                <table className="table card-table table-vcenter">
                  <thead>
                    <tr >
                      <th>MessageId</th>
                      <th>Topic</th>
                      <th>SubTopic</th>
                      <th>Enqueue Date</th>
                      <th>Status</th>
                      <th>Response Code</th>
                      <th>Response Date</th>
                      <th>Subscription Id</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data && data.map((msg) => {
                      return <tr key={msg.messageId}>
                        <td>{msg.messageId}</td>
                        <td>{msg.topic}</td>
                        <td>{msg.subTopic}</td>
                        <td><LocalDate dateString={msg.enqueueDate} /></td>
                        <td>{msg.status}</td>
                        <td>{msg.responseCode}</td>
                        <td><LocalDate dateString={msg.responseDate} /></td>
                        <td>{msg.subscriptionId}</td>
                        <td>
                          <button className="btn btn-default" onClick={() => setActiveItem(msg)}>View</button>
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
    < Modal showModal={activeItem} onHide={handleHide} >
      <div className="modal-header">
        <h5 className="modal-title">Message Detail</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div className="modal-body">
        <div className="row row-cards">
          <div className="col-md-6 col-xl-6"><h4>{activeItem?.topic} {activeItem?.subTopic}</h4></div>
          <div className="col-md-6 col-xl-6 text-end">
            <LocalDate dateString={activeItem?.responseDate} />
          </div>
          <div className="col-12 mt-0">
            <div className="mb-3"><pre className="p-1 ps-2 bg-dark-lt" ><code>POST {activeItem?.url}</code></pre></div>
          </div>
        </div>
        <pre style={{ maxHeight: "150px" }} ><code>{activeItem?.data}</code></pre>
      </div>

      <div className="modal-body">
        <div className="row row-cards">
          <div className="col-md-6 col-xl-6"><h4>Response</h4></div>
          <div className="col-md-6 col-xl-6 text-end">
            <LocalDate dateString={activeItem?.responseDate} />
          </div>
          <div className="col-12 mt-0">
            <div className="mb-3"><pre className="p-1 ps-2 bg-dark-lt" ><code>{activeItem?.responseCode}</code></pre></div>
          </div>
        </div>
      </div>
    </Modal >

  </>
};


export default WebHookLogs;

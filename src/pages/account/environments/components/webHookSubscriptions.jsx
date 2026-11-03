import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../../components/modal.jsx';
import { useFetch } from '../../../../hooks/useFetch.js';
import { SendRequest } from '../../../../hooks/usePost.js';

const topicSettings = {
  Customer: { subTopics: ['Created', 'Updated', 'Deleted'] },
  ValueUpdated: { customSubTopic: 'Value Id' },
  BonusEarned: { customSubTopic: 'Bonus Title' },
  Order: { subTopics: ['Updated', 'Created'] },
  OrderStatusUpdated: { customSubTopic: 'Order Status' },
  Node: { subTopics: ['Created', 'Updated'] },
};

function errorMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error === 'string') {
    try {
      return errorMessage(JSON.parse(error), fallback);
    } catch {
      return error;
    }
  }
  if (error.errors) return Object.values(error.errors).flat().join(' ');
  return error.detail || error.message || error.title || fallback;
}

const WebHookSubscriptions = ({ environmentId }) => {
  const { data, loading, error, refetch } = useFetch(`/api/v1/WebHooks/${environmentId}/Subscriptions`);
  const subscriptions = data ?? [];
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [requestError, setRequestError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const topic = topicSettings[editor?.topic];
  const subTopics = topic?.subTopics ?? [];

  const closeEditor = () => {
    if (!pending.current) setEditor(null);
  };
  const closeDelete = () => {
    if (!pending.current) setDeleting(null);
  };
  const openEditor = (subscription = {}) => {
    setRequestError('');
    setEditor({
      ...subscription,
      topic: subscription.topic ?? '',
      subTopic: subscription.subTopic ?? '',
      url: subscription.url ?? '',
    });
  };
  const changeTopic = (event) => {
    const nextTopic = event.target.value;
    setRequestError('');
    setEditor(value => ({ ...value, topic: nextTopic, subTopic: '' }));
  };
  const changeSubTopic = (event) => {
    const subTopic = event.target.value;
    setEditor(value => ({ ...value, subTopic }));
  };
  const openDelete = (subscription) => {
    setRequestError('');
    setDeleting(subscription);
  };
  const finishRequest = () => {
    pending.current = false;
    setBusy(false);
  };
  const handleSave = (event) => {
    event.preventDefault();
    if (pending.current) return;
    const values = { topic: editor.topic.trim(), subTopic: editor.subTopic.trim() || null, url: editor.url.trim() };
    if (!values.topic) {
      setRequestError('Topic is required.');
      return;
    }
    try {
      const url = new URL(values.url);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      setRequestError('Enter a valid HTTP or HTTPS URL.');
      return;
    }
    pending.current = true;
    setBusy(true);
    setRequestError('');
    const createSubscription = (replacing) => SendRequest('POST', '/api/v1/WebHooks', values, () => {
      refetch();
      finishRequest();
      setEditor(null);
    }, (saveError) => {
      finishRequest();
      const message = errorMessage(saveError, 'Unable to save the webhook. Please try again.');
      setRequestError(replacing ? `The original webhook was deleted, but its replacement could not be created. Save again to retry creating it. ${message}` : message);
    });
    if (editor.id != null) {
      SendRequest('DELETE', `/api/v1/WebHooks/${editor.id}`, null, () => {
        // Retain the form, but skip deletion if creating the replacement needs a retry.
        setEditor(value => ({ ...value, replacedId: value.id, id: null }));
        refetch();
        createSubscription(true);
      }, (deleteError) => {
        finishRequest();
        setRequestError(errorMessage(deleteError, 'Unable to replace the webhook because deletion failed. Please try again.'));
      });
    } else {
      createSubscription(editor.replacedId != null);
    }
  };
  const handleDelete = () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setRequestError('');
    SendRequest('DELETE', `/api/v1/WebHooks/${deleting.id}`, null, () => {
      refetch();
      finishRequest();
      setDeleting(null);
    }, (deleteError) => {
      finishRequest();
      setRequestError(errorMessage(deleteError, 'Unable to delete the webhook. Please try again.'));
    });
  };

  return <>
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Web Hook Subscriptions</h3>
      </div>
      {error && <div className="card-body">
        <div className="alert alert-danger" role="alert">{errorMessage(error, 'Unable to load webhooks.')}</div>
        <button type="button" className="btn btn-default" onClick={() => refetch()} disabled={loading}>Retry</button>
      </div>}
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap table-ellipsis">
          <thead>
            <tr>
              <th>Id</th>
              <th>Topic</th>
              <th>SubTopic</th>
              <th className="w-50">Url</th>
              <th className="w-1" aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => <tr key={subscription.id}>
              <td>{subscription.id}</td>
              <td>{subscription.topic}</td>
              <td>{subscription.subTopic?.trim() ? subscription.subTopic : 'All Subtopics'}</td>
              <td title={subscription.url}>{subscription.url}</td>
              <td>
                <div className="btn-list flex-nowrap">
                  <a className="btn btn-default" href={`/account/environments/${environmentId}/webhooklogs/${subscription.id}`}>Logs</a>
                  <button type="button" className="btn btn-icon" aria-label="Edit" title="Edit webhook" onClick={() => openEditor(subscription)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                  </button>
                  <button type="button" className="btn btn-icon" aria-label="Delete" title="Delete webhook" onClick={() => openDelete(subscription)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="7" x2="20" y2="7"></line><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                  </button>
                </div>
              </td>
            </tr>)}
            {!subscriptions.length && <tr><td colSpan={5} className="text-center text-secondary py-4">
              {loading ? 'Loading webhooks…' : error ? 'Webhooks could not be loaded.' : 'No webhooks configured.'}
            </td></tr>}
          </tbody>
        </table>
      </div>
      <div className="card-footer d-flex">
        <button type="button" className="btn btn-primary ms-auto" onClick={() => openEditor()}>New Webhook</button>
      </div>
    </div>

    <Modal showModal={editor !== null} onHide={closeEditor} dismissible={!busy}>
      <form onSubmit={handleSave}>
        <div className="modal-header">
          <h5 className="modal-title">{editor?.id != null || editor?.replacedId != null ? 'Edit Webhook' : 'New Webhook'}</h5>
          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" disabled={busy}></button>
        </div>
        <div className="modal-body">
          {requestError && <div className="alert alert-danger" role="alert">{requestError}</div>}
          {editor?.id != null && <p className="text-secondary">Saving deletes this subscription and creates a replacement with a new ID.</p>}
          <fieldset disabled={busy}>
            <div className="mb-3">
              <label className="form-label" htmlFor="webhook-topic">Topic</label>
              <select id="webhook-topic" className="form-select" required value={editor?.topic ?? ''} onChange={changeTopic}>
                <option value="">Select Topic</option>
                {editor?.topic && !Object.hasOwn(topicSettings, editor.topic) && <option value={editor.topic}>{editor.topic} (current)</option>}
                {Object.keys(topicSettings).map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="webhook-subtopic">SubTopic <span className="text-secondary">(optional)</span></label>
              {!editor?.topic || topic?.subTopics ? <select id="webhook-subtopic" className="form-select" aria-describedby="webhook-subtopic-help" disabled={!editor?.topic || busy} value={editor?.subTopic ?? ''} onChange={changeSubTopic}>
                <option value="">All SubTopics</option>
                {subTopics.map(value => <option key={value} value={value}>{value}</option>)}
                {editor?.subTopic && !subTopics.includes(editor.subTopic) && <option value={editor.subTopic}>{editor.subTopic} (current)</option>}
              </select> : <input id="webhook-subtopic" className="form-control" aria-describedby="webhook-subtopic-help" placeholder={topic?.customSubTopic ? `Enter ${topic.customSubTopic}` : 'Enter SubTopic'} value={editor?.subTopic ?? ''} onChange={changeSubTopic} />}
              <div id="webhook-subtopic-help" className="form-hint">Leave SubTopic blank to receive webhooks for all SubTopics of the selected Topic.</div>
            </div>
            <div>
              <label className="form-label" htmlFor="webhook-url">Url</label>
              <input id="webhook-url" type="url" className="form-control" required placeholder="https://example.com/webhook" value={editor?.url ?? ''} onChange={event => setEditor(value => ({ ...value, url: event.target.value }))} />
            </div>
          </fieldset>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-link link-secondary" data-bs-dismiss="modal" disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary ms-auto" disabled={busy}>{busy ? 'Saving…' : 'Save Webhook'}</button>
        </div>
      </form>
    </Modal>

    <Modal showModal={deleting !== null} onHide={closeDelete} dismissible={!busy}>
      <div className="modal-header">
        <h5 className="modal-title">Delete Webhook</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" disabled={busy}></button>
      </div>
      <div className="modal-body">
        {requestError && <div className="alert alert-danger" role="alert">{requestError}</div>}
        <p>Delete webhook #{deleting?.id} for {deleting?.topic}{deleting?.subTopic ? ` / ${deleting.subTopic}` : ''}?</p>
        <p className="text-break">{deleting?.url}</p>
        <p className="mb-0">This subscription will stop receiving webhook events.</p>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary" data-bs-dismiss="modal" disabled={busy}>Cancel</button>
        <button type="button" className="btn btn-danger ms-auto" onClick={handleDelete} disabled={busy}>{busy ? 'Deleting…' : 'Delete Webhook'}</button>
      </div>
    </Modal>
  </>;
};

WebHookSubscriptions.propTypes = {
  environmentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default WebHookSubscriptions;

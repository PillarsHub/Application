import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useFetch, Get } from '../../../../hooks/useFetch'
import { SendRequest } from '../../../../hooks/usePost';
import Modal from '../../../../components/modal';
import TextInput from '../../../../components/textInput';
import Switch from '../../../../components/switch';

const AccessTokens = ({ environmentId, environmentName, stats }) => {
  const [newToken, setNewToken] = useState();
  const [delToken, setDelToken] = useState();
  const { error, data, refetch } = useFetch("/api/v1/Tokens", { environmentIds: environmentId });
  if (error) return `Error! ${error}`;

  const handleGenerateNewToken = () => {
    Get("/api/v1/Tokens/generate?readOnly=false", (r) => {
      setNewToken({ ...r });
    }, (error) => {
      setNewToken(v => ({ ...v, error: error }));
    })
  }

  const handleChange = (name, value) => {
    setNewToken(v => ({ ...v, [name]: value }));
  }

  const handleNewToken = () => {
    if (newToken.name) {
      const postObject = { ...newToken };

      if (postObject.readOnly) {
        postObject.access = Object.fromEntries(
          Object.entries(postObject.access).map(([key]) => [key, "ReadOnly"])
        );
      }

      SendRequest("POST", "/api/v1/Tokens/" + environmentId, postObject, () => {
        refetch();
        setNewToken();
      }, (error) => {
        setNewToken(v => ({ ...v, error: error }));
      })
    } else {
      setNewToken(v => ({ ...v, error: 'Name is required' }));
    }
  }

  const handleDeleteToken = () => {
    SendRequest("DELETE", `/api/v1/Tokens/${environmentId}/${delToken}`, {}, () => {
      refetch();
      setDelToken();
    }, (error) => {
      alert(error);
    })
  }

  const toClipboard = () => {
    navigator.clipboard.writeText(newToken.token).then(() => {
      console.log('Text successfully copied to clipboard');
    }).catch((err) => {
      console.error('Unable to copy text to clipboard', err);
    });
  };

  const groupedArray = stats?.filter(item => item.environmentId == environmentId).reduce((acc, currentItem) => {
    const existingItem = acc.find(item => item.key === currentItem.key);

    if (existingItem) {
      // If the date already exists, update the sum and count
      existingItem.sumResponseTime += currentItem.averageResponseTime;
      existingItem.count += 1;
      existingItem.callCount += currentItem.callCount;
    } else {
      // If the date doesn't exist, add a new entry to the accumulator
      acc.push({
        sumResponseTime: currentItem.averageResponseTime,
        count: 1,
        callCount: currentItem.callCount,
        key: currentItem.key,
      });
    }

    return acc;
  }, []) ?? [];

  return <>
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          Access Tokens
        </h3>
      </div>
      <table className="table table-vcenter card-table">
        <thead>
          <tr>
            <th>Name</th>
            <th className="text-center">Environment</th>
            <th className="text-center">Token</th>
            <th className="text-center">REQUESTS THIS PERIOD</th>
            <th className="text-center">Average Response Time</th>
            <th className="text-center">Last Used</th>
            <th className="w-1"></th>
          </tr>
        </thead>
        {data && data.map((token) => {

          var stat = groupedArray.find(d => d.key == token.key)

          return <tr key={token.id}>
            <td>{token.name}</td>
            <td className="text-center">{environmentName}</td>
            <td className="text-center">{getLastSixCharacters(token.key)}</td>
            <td className="text-center">{stat?.callCount ?? 0}</td>
            <td className="text-center">{stat?.count > 0 ? Math.round(stat.sumResponseTime / stat.count) : 0} ms</td>
            <td className="text-center">{token.lastUsed}</td>
            <td>
              <div className="btn-list flex-nowrap">
                <button className="btn btn-icon" onClick={() => setDelToken(token.id)} >
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="7" x2="20" y2="7"></line><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        })}
        <tbody>
        </tbody>
      </table>
      <div className="card-footer">
        <div className="d-flex">
          <button className="btn btn-primary ms-auto" onClick={handleGenerateNewToken} >New Token</button>
        </div>
      </div>
    </div>

    <Modal showModal={delToken != undefined} onHide={() => setDelToken()} >
      <div className="modal-header">
        <h5 className="modal-title">Delete Token</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body py-4">
        <div className="modal-title">Are you sure you want to delete this Access Token?</div>
        <div className="mb-2">Please ensure that anyone currently using this token is informed to update to a new token, as failure to do so will result in a loss of access.</div>

      </div>
      <div className="modal-footer">
        <button className="btn btn-link link-secondary" data-bs-dismiss="modal">Cancel</button>
        <button className="btn btn-danger ms-auto" onClick={handleDeleteToken}>
          Delete Token
        </button>
      </div>

    </Modal>

    <Modal showModal={newToken != undefined} onHide={() => setNewToken()} >
      <div className="modal-header">
        <h5 className="modal-title">New Token</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">

        <div className="mb-3">
          <label className="form-label">Token Name</label>
          <TextInput name="name" errorText={newToken?.error ?? ''} value={newToken?.name ?? ''} placeholder="Token Name" onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label className="row">
            <span className="col">
              <Switch title="Read Only" name="readOnly" value={newToken?.readOnly} onChange={handleChange} />
            </span>
            <span className="col-auto">
              <span className="text-muted small">When enabled, this token will only be able to process GET methods</span>
            </span>
          </label>
        </div>

        <div className="mb-3">
          <label className="form-label">Token</label>
          <div className="input-group mb-2">
            <input id="addTokenValue" value={newToken?.token ?? ''} type="text" className="form-control" disabled />
            <button onClick={() => toClipboard('addTokenValue')} className="btn btn-icon" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M15 3v4a1 1 0 0 0 1 1h4"></path><path d="M18 17h-7a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h4l5 5v7a2 2 0 0 1 -2 2z"></path><path d="M16 17v2a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h2"></path></svg>
            </button>
          </div>
        </div>

        <div className="alert alert-danger" role="alert">
          <div className="d-flex">
            <div>
              <div>This will be the only time you can view this token. Please keep it safe.</div>
            </div>
          </div>
        </div>

      </div>
      <div className="modal-footer">
        <button className="btn btn-link link-secondary" data-bs-dismiss="modal">Cancel</button>
        <button className="btn btn-primary ms-auto" onClick={handleNewToken}>
          Save Token
        </button>
      </div>

    </Modal>
  </>
};

function getLastSixCharacters(inputString) {
  if (inputString.length >= 5) {
    return '...' + inputString.slice(-5);
  } else {
    return inputString;
  }
}

export default AccessTokens;

AccessTokens.propTypes = {
  environmentId: PropTypes.string.isRequired,
  environmentName: PropTypes.string.isRequired,
  stats: PropTypes.any.isRequired
}


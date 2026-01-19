import PropTypes from 'prop-types';
import { GetToken } from '../features/authentication/hooks/useToken.jsx';
import BaseUrl from './baseUrl';

function Post(url, object, onSuccess, onError) {
  SendRequest("POST", url, object, onSuccess, onError);
}

function Put(url, object, onSuccess, onError) {
  SendRequest("PUT", url, object, onSuccess, onError);
}

function SendRequest(method, url, object, onSuccess, onError) {
  var data = JSON.stringify(object);
  SendRawRequest(method, url, "application/json", data, onSuccess, onError);
}

function SendRawRequest(method, url, contentType, data, onSuccess, onError) {
  let xhr = new XMLHttpRequest();
  let fullUrl = BaseUrl + url;
  if (url.startsWith("https")) fullUrl = url;

  // Create a state change callback
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status <= 205) {
        if (xhr.response) {
          onSuccess(JSON.parse(xhr.response));
        }
        else {
          onSuccess(undefined);
        }
      }
      else {
        onError(xhr.responseText, xhr.status);
      }
    }
  };

  // open a connection
  xhr.open(method, fullUrl, true);

  // Set the request header i.e. which type of content you are sending
  if (contentType) {
    xhr.setRequestHeader("Content-Type", contentType);
  }
  xhr.setRequestHeader("Authorization", GetToken()?.token);

  // Sending data with the request
  xhr.send(data);
}


Post.propTypes = {
  url: PropTypes.string.isRequired,
  object: PropTypes.any.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func
}

Put.propTypes = {
  url: PropTypes.string.isRequired,
  object: PropTypes.any.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func
}

SendRequest.propTypes = {
  method: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  object: PropTypes.any.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func
}

export { Post, Put, SendRequest, SendRawRequest };
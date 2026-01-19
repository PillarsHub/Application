import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid'; // Using uuid library for fallback
import { Get } from '../hooks/useFetch';

import "./autocomplete.css";

const generateUUID = () => {
  try {
    return crypto.randomUUID().replace(/-/g, '_');
  } catch (e) {
    return uuidv4().replace(/-/g, '_');
  }
};

const AutoComplete = ({ name, value, placeholder = 'Search...', showIcon = true, onChange, allowNull = false, disabled, errorText, errored, showClear = false }) => {
  const [inputId] = useState(() => 'modal_' + generateUUID());
  const [loading, setLoading] = useState(false);

  const handleChange = (v) => {
    if (!v && !allowNull) return;
    onChange(name, v);
  };

  useEffect(() => {
    autocomplete(document.getElementById(inputId), handleChange, setLoading);
  }, []);

  useEffect(() => {
    setValue(document.getElementById(inputId), value, setLoading);
  }, [value]);

  const className = "form-control";
  const inputClass = (errorText || errored) ? `${className} is-invalid` : className;

  const showClearIcon = showClear && value != '' && value != null;
  const groupClass = showClearIcon ? 'input-group input-group-flat' : 'input-icon';

  return <>
    <div className={groupClass}>
      <input id={inputId} className={`${inputClass}`} placeholder={placeholder} name={name} disabled={disabled} autoComplete='off' />
      {showClearIcon && <>
        <span className="input-group-text">
          <a href="#" className="link-secondary" data-bs-toggle="tooltip" aria-label="Clear search" data-bs-original-title="Clear search" onClick={() => handleChange(null)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </a>
        </span>
      </>}
      {showIcon && !showClearIcon && !loading && <span className="input-icon-addon">
        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><circle cx="10" cy="10" r="7" /><line x1="21" y1="21" x2="15" y2="15" /></svg>
      </span>}
      {loading && <span className="input-icon-addon">
        <div className="spinner-border spinner-border-sm text-secondary" role="status"></div>
      </span>}
      {errorText && <div className="invalid-feedback">{errorText}</div>}
    </div>
  </>
}

export default AutoComplete;

AutoComplete.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  showIcon: PropTypes.bool,
  onChange: PropTypes.func,
  allowNull: PropTypes.bool,
  disabled: PropTypes.bool,
  errorText: PropTypes.string,
  errored: PropTypes.bool,
  showClear: PropTypes.bool
}

function formatText(customer) {
  return `${customer.fullName} (${customer.webAlias ?? customer.id})`;
}

function setValue(inp, value, setLoading) {
  if (inp.dataset.value != value) {
    if (value != undefined && value !== '') {
      inp.value = 'loading....';
      setLoading(true);
      Get(`/api/v1/Customers/${value}`, (customer) => {
        inp.dataset.value = value;
        inp.value = formatText(customer);
        setLoading(false);
      }, (error, statusCode) => {
        setLoading(true);
        alert(`${statusCode}: ${error}`);
      });
    } else {
      inp.dataset.value = value;
      inp.value = ``;
    }
  }
}

function autocomplete(inp, onItemSelect, setLoading) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function (e) {
    var a, b, i, val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();
    if (!val) { return false; }
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.appendChild(a);

    var search = e.target.value;
    setLoading(true);

    Get(`/api/v1/Customers/Find?search=${search}&count=10&fullName=true&emailAddress=true&webAlias=true`, (customers) => {
      var arr = customers.filter((item) => item.scopeLevel != 'Upline').map((customer) => { return { id: customer.id, value: formatText(customer) } });
      setLoading(false);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*create a DIV element for each matching element:*/
        b = document.createElement("DIV");
        /*make the matching letters bold:*/
        //b.innerHTML = "<strong>" + arr[i].value.substr(0, val.length) + "</strong>";
        b.innerHTML = arr[i].value.substr(0, val.length);
        b.innerHTML += arr[i].value.substr(val.length);
        /*insert a input field that will hold the current array item's value:*/
        b.innerHTML += "<input type='hidden' data-text='" + arr[i].value + "' value='" + arr[i].id + "'>";
        /*execute a function when someone clicks on the item value (DIV element):*/
        b.addEventListener("click", function () {
          /*insert the value for the autocomplete text field:*/
          inp.value = this.getElementsByTagName("input")[0].getAttribute('data-text');
          inp.dataset.value = this.getElementsByTagName("input")[0].value;
          onItemSelect(inp.dataset.value);
          /*close the list of autocompleted values,
          (or any other open lists of autocompleted values:*/
          closeAllLists();
        });
        a.appendChild(b);
      }
    }, () => { });
  });

  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function (e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      e.preventDefault();
      /*If the arrow DOWN key is pressed,
      increase the currentFocus variable:*/
      currentFocus++;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 38) { //up
      e.preventDefault();
      /*If the arrow UP key is pressed,
      decrease the currentFocus variable:*/
      currentFocus--;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 13) {
      /*If the ENTER key is pressed, prevent the form from being submitted,*/
      e.preventDefault();
      if (currentFocus < 0) currentFocus = 0;
      if (currentFocus > -1 && x) {
        /*and simulate a click on the "active" item:*/
        x[currentFocus]?.click();
      } else {
        if (e.currentTarget.value == '') onItemSelect(null);
      }
    }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}
import React, { useRef, useEffect, useState } from "react";
import parse from 'html-react-parser';
import { useFetch } from "../../hooks/useFetch.js";
import { SendRequest } from "../../hooks/usePost.js";
import PageHeader from "../../components/pageHeader.jsx";
import Modal from "../../components/modal.jsx";
import TextInput from "../../components/textInput.jsx";
import SelectInput from "../../components/selectInput.jsx";
import SettingsNav from "./settingsNav.jsx";
import SortableRow from "./sortableRow.jsx";
import AvailabilityInput from "../../components/availabilityInput.jsx";

import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const Navigation = () => {
  const { data, loading, error } = useFetch('/api/v1/Menus');
  const { data: dashboards, loading: dashLoading, error: dashError } = useFetch("/api/v1/Dashboards");
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuItems, setMenuItems] = useState();
  const [activeLink, setActiveLink] = useState(false);
  const [dialogError, setDialogError] = useState();
  const [show, setShow] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [modalTab, setModalTab] = useState(1);

  const [pages, setPages] = useState([]);

  const [loaded, setLoaded] = useState(false);
  const isFirstRender = useRef(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    if (data) {
      setMenuItems(data.map((menu) => ({
        ...menu,
        items: menu.items.map((item, itemIndex) => ({
          ...item,
          id: itemIndex + 1, // Setting the id based on the index
        })),
      })));
      setLoaded(true);
    }
  }, [data])

  useEffect(() => {
    if (loaded) {
      if (!isFirstRender.current) {
        handleSave();
      } else {
        isFirstRender.current = false;
      }
    }
  }, [menuItems])

  useEffect(() => {
    if (dashboards) {
      const internalPages = [
        { url: '/customers', title: 'Recent Customers', type: "Corporate" },
        { url: '/reports', title: 'Reports', type: "Corporate" },
        { url: '/commissions/periods', title: 'Commission Periods', type: "Corporate" },
        { url: '/commissions/payables', title: 'Commission Payables (Legacy)', type: "Corporate" },
        { url: '/commissions/payables2', title: 'Commission Payables', type: "Corporate" },
        { url: '/commissions/paid', title: 'Commissions Paid', type: "Corporate" },
        { url: '/inventory/products', title: 'Product List', type: "Corporate" },
        { url: '/inventory/categories', title: 'Category List', type: "Corporate" },
        { url: '/inventory/stores', title: 'Store List', type: "Corporate" },
        { url: '/tools/adjustments', title: 'Commission Adjustments', type: "Corporate" },
        { url: '/schedule', title: 'Event Calendar', type: "Corporate" },
        { url: '/media', title: 'Media Library', type: "Corporate" },
        { url: '/training', title: 'Training Course Admin', type: "Corporate" },
        { url: '/reports/graphql', title: 'GraphQL Playground', type: "Corporate" },

        { url: '/customers/{customerId}/summary', title: 'Customer Details', type: "Customer" },
        { url: '/customers/{customerId}/team', title: 'Customer Team', type: "Customer" },
        { url: '/customers/{customerId}/dashboard', title: 'Dashboard', type: "Customer" },
        { url: '/customers/{customerId}/orders', title: 'Customer Orders', type: "Customer" },
        { url: '/customers/{customerId}/reports', title: 'Customer Reports', type: "Customer" },
        { url: '/customers/{customerId}/autoships', title: 'Customer Autoships', type: "Customer" },
        { url: '/customers/{customerId}/commissions', title: 'Customer Commissions', type: "Customer" },
        { url: '/customers/{customerId}/training', title: 'Training Courses', type: "Customer" },
        { url: '/customers/{customerId}/account/profile', title: 'Customer Account', type: "Customer" },
        { url: '/customers/{customerId}/media', title: 'Media Library', type: "Customer" },
      ]

      const merged = internalPages
        .map(a => ({ url: a.url, title: a.title, type: a.type }))
        .concat(dashboards.filter(b => b.type !== 'System').map(b => {
          var urlBase = b.type == "Customer" ? `/customers/{customerId}` : '/page';
          return ({ url: `${urlBase}/${b.id}`, title: b.name, type: b.type })
        }));

      setPages(merged);
    }
  }, [dashboards])

  const handleSetTab = (index) => {
    setActiveIndex(index);
  }

  const handleHideDelete = () => setShowDelete(false);
  const handleShowDelete = (id) => {
    const activeMenu = menuItems[activeIndex];
    var item = activeMenu.items.find(item => item.id === id)
    setActiveLink(item);
    setShowDelete(true);
  }

  const handleDelete = () => {
    setMenuItems((prevItems) => {
      const items = [...prevItems];
      const activeMenu = items[activeIndex];

      var index = activeMenu.items.findIndex(item => item.id === activeLink.id)
      if (index > -1) {
        activeMenu.items.splice(index, 1);
      }

      return items;
    })
    setShowDelete(false);
  }

  const handleHide = () => setShow(false);
  const handleShow = (id) => {
    const activeMenu = menuItems[activeIndex];
    var item = activeMenu.items.find(item => item.id === id)
    if (!item) item = { url: pages[0].url };

    let type = "Label";
    if (item.url) {
      var pageIndex = pages.findIndex(p => p.url.toLowerCase() == item.url.toLowerCase())
      type = pageIndex > -1 ? "Page" : "Url";
    }

    setActiveLink({ ...item, type: type })
    setModalTab(1);
    setShow(true);
  }

  const handleChage = (name, value) => {
    if (name == "type") {
      setActiveLink(e => ({ ...e, type: value, url: '' }));
    } else {
      setActiveLink(e => ({ ...e, [name]: value }));
    }
    setDialogError();
  }

  const handleItemUpdate = () => {
    if ((activeLink?.title ?? '') == '') {
      setDialogError({ title: "Title is Required" });
    } else {
      setMenuItems((prevItems) => {
        const items = [...prevItems];
        const activeMenu = items[activeIndex];
        var index = activeMenu.items.findIndex(item => item.id === activeLink.id)
        if (index > -1) {
          activeMenu.items[index] = activeLink;
        } else {
          activeLink.id = crypto.randomUUID();
          activeMenu.items.push(activeLink);
        }
        return items;
      })
      setShow(false);
    }
  }

  const handleSave = () => {
    const activeMenu = menuItems[activeIndex];
    SendRequest("PUT", "/api/v1/Menus", activeMenu, () => {
    }, (error, code) => {
      alert(code + ": " + error);
    });
  }

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setMenuItems((prevItems) => {
        const items = [...prevItems];
        const activeMenu = items[activeIndex];

        if (!activeMenu || !activeMenu.items) {
          return prevItems; // Early return if activeIndex or items are invalid
        }

        const oldIndex = activeMenu.items.findIndex(item => item.id === active.id);
        const newIndex = activeMenu.items.findIndex(item => item.id === over.id);

        // Check if the indices are valid
        if (oldIndex === -1 || newIndex === -1) {
          return prevItems; // Return previous state if indices are invalid
        }

        activeMenu.items = arrayMove([...activeMenu.items], oldIndex, newIndex);

        return items;
      });
    }
  };

  const items = menuItems ? menuItems[activeIndex].items : [];
  const menuType = menuItems ? menuItems[activeIndex].type : "";

  return <>
    <PageHeader title="Navigation" preTitle="Settings">
      <SettingsNav title="Navigation" loading={loading || dashLoading} error={error || dashError} pageId="navigation">
        {/* <div className="card-header"><span className="card-title">System Menus</span></div> */}
        <div className="card-header inverted">
          <ul className="nav nav-tabs card-header-tabs">
            {menuItems && menuItems.map((m, index) => {
              return <li key={m.name} className="nav-item">
                <a href="#" onClick={(e) => { handleSetTab(index); e.preventDefault(); }} className={`nav-link ${index == activeIndex ? 'active' : ''}`}>{m.name}</a>
              </li>
            })}
          </ul>
        </div>
        <div className="table-responsive">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} >
            <SortableContext items={items} strategy={verticalListSortingStrategy} >
              <table className="table table-vcenter table-border table-nowrap card-table table-ellipsis">
                <thead>
                  <tr>
                    <th className="w-1"></th>
                    <th>Title</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th className="w-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <SortableRow key={item.id} id={item.id} data={item} internalPages={pages} onEdit={handleShow} onDelete={handleShowDelete} />
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
        <div className="card-footer">
          <div className="row">
            <div className="col">
            </div>
            <div className="col-auto">
              <button className="btn btn-primary" onClick={handleShow}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon "><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 4m0 1a1 1 0 0 1 1 -1h14a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1z" /><path d="M4 12m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M14 12l6 0" /><path d="M14 16l6 0" /><path d="M14 20l6 0" /></svg>
                Add Link
              </button>
            </div>
          </div>
        </div>
      </SettingsNav>
    </PageHeader>

    <Modal showModal={showDelete} size="sm" onHide={handleHideDelete} >
      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      <div className="modal-body text-center py-4">
        <h3>Are you sure?</h3>
        <div className="text-muted">Do you really want to remove <strong>{activeLink.title}</strong></div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-danger ms-auto" onClick={handleDelete}>
          Delete Link
        </button>
      </div>
    </Modal>

    {activeLink && <Modal showModal={show} onHide={handleHide}>
      <div className="modal-header border-bottom-0">
        <h5 className="modal-title">Navigation Link</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="card border-bottom-0">
        {menuType == 'Customer' && <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs" data-bs-toggle="tabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button className={`nav-link ${modalTab == 1 ? 'active' : ''}`} onClick={() => setModalTab(1)} >Content</button>
            </li>
            <li className="nav-item" role="presentation">
              <button className={`nav-link ${modalTab == 2 ? 'active' : ''}`} onClick={() => setModalTab(2)}>Requirements</button>
            </li>
          </ul>
        </div>}

        {modalTab == 1 && <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Type</label>
                <SelectInput name="type" value={activeLink?.type} errorText={dialogError?.type} onChange={handleChage}>
                  <option value="Page">Page</option>
                  <option value="Url">Url</option>
                  <option value="Label">Label</option>
                </SelectInput>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Title</label>
                <TextInput name="title" value={activeLink?.title} errorText={dialogError?.title} onChange={handleChage} />
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Status</label>
                <SelectInput name="status" value={activeLink?.status} errorText={dialogError?.status} onChange={handleChage}>
                  <option value="Enabled">Visible</option>
                  {menuType == 'Customer' && <option value="Corporate">Corporate</option>}
                  <option value="Disabled">Hidden</option>
                </SelectInput>
              </div>
            </div>
            <div className="col-md-12">
              {activeLink.type == "Url" &&
                <div className="mb-3">
                  <label className="form-label">Destination Url</label>
                  <TextInput name="url" value={activeLink?.url} errorText={dialogError?.url} onChange={handleChage} />
                </div>
              }
              {activeLink.type == "Page" &&
                <div className="mb-3">
                  <label className="form-label">Destination Page</label>
                  <SelectInput name="url" value={activeLink?.url} errorText={dialogError?.url} onChange={handleChage}>
                    <option disabled selected value=""> -- Select a page -- </option>
                    {pages.filter(p => p.type == menuType).map((page) => {
                      return <option key={page} value={page.url}>{page.title}</option>
                    })}
                  </SelectInput>
                </div>
              }
            </div>
            {activeLink.type != "Label" && <div className="col-md-12">
              <div className="mb-3">
                <label className="form-label">SVG Icon</label>
                <div className="input-group mb-2">
                  <span className="input-group-text">
                    {activeLink?.icon && parse(activeLink?.icon)}
                  </span>
                  <TextInput name="icon" value={activeLink?.icon} errorText={dialogError?.icon} onChange={handleChage} />
                </div>
                <small className="form-hint">
                  An SVG element representing the icon for the menu item. <a href="https://tabler.io/icons" target="_blank" rel="noreferrer">More Information</a>
                </small>
              </div>
            </div>}
          </div>
        </div>}

        {modalTab == 2 && <div className="m-1 bodered">
          <AvailabilityInput name="availability" resourceName="" value={activeLink?.availability ?? []} onChange={handleChage} />
        </div>}

      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleItemUpdate}>Save Link</button>
      </div>
    </Modal>}
  </>
}

export default Navigation;
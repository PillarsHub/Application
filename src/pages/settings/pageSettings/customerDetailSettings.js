import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import PageHeader, { CardHeader } from "../../../components/pageHeader";
import Modal from "../../../components/modal"
import useWidgets, { WidgetTypes } from "../../../features/widgets/hooks/useWidgets";
import { useFetch } from "../../../hooks/useFetch";
import { SendRequest } from "../../../hooks/usePost";
import DataLoading from "../../../components/dataLoading";
import DataError from "../../../components/dataError";
import { closestCenter, DndContext, DragOverlay, PointerSensor, useSensor } from '@dnd-kit/core';
import { SortableContext, rectSwappingStrategy } from '@dnd-kit/sortable';
import SortGridItem from '../sortGridItem';
import EmptyContent from "../../../components/emptyContent";

var GET_TREES = gql`query {
  trees
  {
    name
    id
  }
}`

const CustomerDetailSettings = () => {
  const initialRender = useRef(true);
  const params = useParams()
  let initId = params.pageId;
  if (initId == 'customer') initId = "CSDB";
  if (initId == 'dashboard') initId = "PDB";

  const sensors = [useSensor(PointerSensor)];
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(null);

  const { data, loading, error } = useFetch(`/api/v1/dashboards/${initId}`, {}, { id: initId, children: [] });
  const { widgets, loading: wLoading, error: wError, refetch, CreateWidget, DeleteWidget, PublishWidget } = useWidgets();
  const [dashboardMeta, setDashboardMeta] = useState();
  const [showDel, setShowDel] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState(false);
  const { data: treeData } = useQuery(GET_TREES, { variables: {} });

  const [items, setItems] = useState();

  useEffect(() => {
    if (data) {
      setDashboardMeta({ id: data.id, name: data.name, type: data.type, description: data.description });
      setItems(data.children);
    }
  }, [data]);

  const handleSave = () => {
    const item = {
      id: dashboardMeta.id,
      name: dashboardMeta.name,
      type: dashboardMeta.type,
      description: dashboardMeta.description,
      children: items
    }
    SendRequest("PUT", "/api/v1/dashboards/" + item.id, item, () => {
    }, (error, code) => {
      alert(code + ": " + error);
    });
  }

  useEffect(() => {
    if (items && !initialRender.current) {
      handleSave();
    }

    if (items && initialRender.current) {
      initialRender.current = false;
    }
  }, [items]);

  if (error) return <DataError error={error} />;
  if (wError) return <DataError error={wError} />;
  if (loading) return <DataLoading />
  if (wLoading) return <DataLoading />
  if (!dashboardMeta) return <DataLoading />

  const handlePublish = (id, publish) => {
    var item = findId(items, id).item;
    PublishWidget(item.widgetId, publish, () => {
      refetch();
    })
  }

  const handleDelhide = () => setShowDel(false);
  const handleDelShow = (id) => {
    setCurrent(findId(items, id).item);
    setShowDel(true)
  }

  const handleDelete = () => {
    handleDelhide();
    DeleteWidget(current.widgetId, () => {
      setItems((prevData) => {
        const source = findId(prevData, current.id);
        if (source) {
          source.arr.splice(source.index, 1);
        }

        return [...prevData]; // Return the original data if source or target not found
      });
    })
  }

  const handleAddhide = () => setShowEdit(false);
  const handleAddShow = (id) => {
    setCurrent(findId(items, id)?.item);
    setShowEdit(true)
  }

  const handleActiveEdit = (name, value) => {
    setCurrent(e => ({ ...e, [name]: value }));
  }

  const handleResize = (id, size) => {
    setItems((d) => {
      const source = findId(d, id);

      if (source) {
        source.arr[source.index].columns = size;
      }

      return [...d];
    });
  }

  const handleAdd = () => {
    setShowEdit(false);
    if ((current?.widgetType ?? '') == '') {
      setItems((items) => {
        const newItems = [...items];
        const newItem = { id: crypto.randomUUID(), widgetId: '', columns: (current?.id ? 12 : 4), children: [] }

        if (current?.id) {
          const activeItem = findItemAndParent(newItems, current.id);
          const { parent: activeParent, index: activeIndex, } = activeItem;
          activeParent[activeIndex].children.push(newItem);
        } else {
          newItems.push(newItem);
        }

        return newItems;
      });
    } else {
      CreateWidget(current.widgetType, (w) => {
        setItems((items) => {
          const newItems = [...items];
          const newItem = { id: crypto.randomUUID(), widgetId: w?.id, state: 1, columns: (current?.id ? 12 : 6), children: [] }

          if (current?.id) {
            const activeItem = findItemAndParent(newItems, current.id);
            const { parent: activeParent, index: activeIndex, } = activeItem;
            activeParent[activeIndex].children.push(newItem);
          } else {
            newItems.push(newItem);
          }

          return newItems;
        });
      })
    }
  }

  /* Drag Handlers */
  const handleDragStart = ({ active }) => {
    const index = items.findIndex((item) => item.id === active.id);
    setActiveIndex(index);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveIndex(null);

    if (active.id !== over.id) {
      setItems((items) => {
        const newItems = [...items];
        const activeItem = findItemAndParent(newItems, active.id);
        const overItem = findItemAndParent(newItems, over.id);

        if (!activeItem || !overItem) {
          return newItems;
        }

        const { parent: activeParent, index: activeIndex, path: activePath } = activeItem;
        const { parent: overParent, index: overIndex } = overItem;

        // Check if the over item is a parent of the active item
        const isParent = activePath.some((item) => item.id === over.id);
        if (isParent) {
          // Prevent swap if the over item is a parent of the active item
          return newItems;
        }

        // Extract columns property
        const activeColumns = activeParent[activeIndex].columns;
        const overColumns = overParent[overIndex].columns;

        // Swap the items
        const temp = { ...activeParent[activeIndex], columns: overColumns };
        activeParent[activeIndex] = { ...overParent[overIndex], columns: activeColumns };
        overParent[overIndex] = temp;
        return newItems;

      });
    }
  };

  const findItemAndParent = (items, id, path = []) => {
    for (let i = 0; i < items.length; i++) {
      const currentPath = [...path, items[i]];
      if (items[i].id === id) {
        return { parent: items, index: i, path: currentPath };
      }
      if (items[i].children) {
        const result = findItemAndParent(items[i].children, id, currentPath);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };

  let pageName = capitalizeFirstLetter((dashboardMeta?.name ?? '') == '' ? dashboardMeta?.id : dashboardMeta?.name);
  if (dashboardMeta.id == 'CSDB') pageName = "Customer Detail";
  if (dashboardMeta.id == 'PDB') pageName = "Dashboard";

  return <>
    <PageHeader title={`${pageName} Settings`} postTitle={dashboardMeta?.description} breadcrumbs={[{ title: `Pages`, link: `/settings/pages` }, { title: "Edit Page" }]}>
      <CardHeader>
        <button className="btn btn-default" onClick={handleAddShow}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-layout-grid-add" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M14 17h6m-3 -3v6"></path></svg>
          Add Widget
        </button>
      </CardHeader>
      <div className="container-xl">
        {(!items || items.length == 0) && <>
          <EmptyContent />
        </>}
        {widgets && items && <>
          <div ref={containerRef}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((item) => item.title)} strategy={rectSwappingStrategy}>
                <div className="row row-cards row-deck mb-3">
                  {items && items.map((item, itemIndex) => {
                    return <SortGridItem key={item.id} id={item.id} col={item.columns} item={item} pageId={dashboardMeta.id} widgets={widgets} trees={treeData?.trees} onAdd={handleAddShow} onResize={handleResize} onDelete={handleDelShow} onPublish={handlePublish} styles={activeIndex === itemIndex ? { opacity: 0 } : {}} />
                  })}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeIndex != null ? (
                  <div className="col-12" style={{ position: 'absolute', left: 0, top: 0, zIndex: 1000 }}>
                    <SortGridItem col={12} item={items[activeIndex]} widgets={widgets} trees={treeData?.trees} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </>}
      </div>
    </PageHeader>

    <Modal showModal={showEdit} onHide={handleAddhide}>
      <div className="modal-header">
        <h5 className="modal-title">Widget Settings</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Widget</label>
              <select className="form-select" name="widgetType" value={current?.widgetType ?? ''} onChange={(e) => handleActiveEdit(e.target.name, e.target.value)}>
                <option value="">Container</option>
                {WidgetTypes && Object.keys(WidgetTypes).map((key) => {
                  return <option key={key} value={WidgetTypes[key]}>{key}</option>
                })}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleAdd}>Add Widget</button>
      </div>
    </Modal>

    <Modal showModal={showDel} size="sm" onHide={handleDelhide}>
      <div className="modal-body">
        <div className="modal-title">Are you sure?</div>
        <div>If you proceed, you will lose widget settings.</div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Widget</button>
      </div>
    </Modal>
  </>
}

function findId(arr, targetId) {
  for (let index = 0; index < arr.length; index++) {
    const obj = arr[index];

    if (obj?.id === targetId) {
      return { item: obj, arr, index };
    }

    if (obj.children && Array.isArray(obj.children)) {
      const result = findId(obj.children, targetId);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default CustomerDetailSettings;
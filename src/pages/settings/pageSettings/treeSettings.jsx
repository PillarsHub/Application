import React, { useEffect, useState, useRef } from "react";
import { useQuery, gql } from "@apollo/client";
import { useParams } from "react-router-dom"
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
import OffCanvas from "../../../components/offCanvas";
import SelectInput from "../../../components/selectInput";

var GET_TREES = gql`query {
  trees
  {
    name
    id
  }
}`

const TreeSettings = () => {
  let params = useParams()
  const sensors = [useSensor(PointerSensor)];
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const initialRender = useRef(true);

  const dId = `T${params.treeId}DB`;
  const { data, loading, error } = useFetch(`/api/v1/dashboards/${dId}`, {}, { id: dId, children: [{}, {}, { children: [] }] });
  const { widgets, loading: wLoading, error: wError, refetch, CreateWidget, DeleteWidget, PublishWidget } = useWidgets();
  const [dashboardId, setDashboardId] = useState();
  const [showDel, setShowDel] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const { data: treeData } = useQuery(GET_TREES, { variables: {} });

  const [frontId, setFrontId] = useState(false);
  const [backId, setBackId] = useState(false);

  const [items, setItems] = useState();

  useEffect(() => {
    if (data) {
      setDashboardId(data.id);
      setFrontId(data.children[0].widgetId);
      setBackId(data.children[1].widgetId);
      setItems(data.children[2].children)
    }
  }, [data]);

  useEffect(() => {
    if (items && !initialRender.current) {
      handleSave();
    }

    if (items && initialRender.current) {
      initialRender.current = false;
    }
  }, [items, frontId, backId]);

  if (error) return <DataError error={error} />;
  if (wError) return <DataError error={wError} />;
  if (loading) return <DataLoading />
  if (wLoading) return <DataLoading />

  const handleSave = () => {
    const item = {
      id: dashboardId,
      children: [{ widgetId: frontId, columns: 12 }, { widgetId: backId, columns: 12 }, { children: items }]
    }
    SendRequest("PUT", "/api/v1/dashboards/" + item.id, item, () => {
    }, (error, code) => {
      alert(code + ": " + error);
    });
  }

  const handlePublish = (id, publish) => {
    const widget = findId(items, id);
    PublishWidget(widget.item.widgetId, publish, () => {
      refetch();
    })
  }

  const handleDelhide = () => setShowDel(false);
  const handleDelShow = (id) => {
    setCurrent(findId(items, id).item);
    setShowDel(true)
  }

  const handleFacePublish = (face, publish) => {
    var widgetId = '';
    if (face == 'front') {
      widgetId = frontId;
    } else if (face == 'back') {
      widgetId = backId;
    }

    PublishWidget(widgetId, publish, () => {
      refetch();
    })
  }

  const handleFaceDelete = (face) => {
    var widgetId = '';
    if (face == 'front') {
      widgetId = frontId;
    } else if (face == 'back') {
      widgetId = backId;
    }

    DeleteWidget(widgetId, () => {
      if (face == 'front') {
        setFrontId();
      } else if (face == 'back') {
        setBackId();
      }
    })
  }

  const handleDelete = () => {
    handleDelhide();
    DeleteWidget(current.widgetId, () => {
      setItems((prevData) => {
        const source = findId(prevData, current.id);
        if (source) {
          source.arr.splice(source.index, 1);
        }

        return [...prevData];
      });
    })
  }

  const handleAddhide = () => setShowEdit(false);
  const handleAddShow = (id) => {
    if (id == 'front' || id == 'back') {
      setCurrent({ id: id });
    } else {
      setCurrent(findId(items, id)?.item);
    }
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
    CreateWidget(current.widgetId, (w) => {
      if (current?.id == 'front') {
        setFrontId(w.id);
      } else if (current?.id == 'back') {
        setBackId(w?.id);
      } else {
        setItems((items) => {
          const newItems = [...items];
          const newItem = { id: crypto.randomUUID(), widgetId: w?.id, columns: 12, children: [] }

          if (current?.id) {
            const activeItem = findItemAndParent(newItems, current.id);
            const { parent: activeParent, index: activeIndex, } = activeItem;
            activeParent[activeIndex].children.push(newItem);
          } else {
            newItems.push(newItem);
          }

          return newItems;
        });
      }
    })
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

  const handleHideSidePanel = () => setShowSidePanel(false);
  const handleShowSidepanel = () => setShowSidePanel(true);

  const treeTitle = treeData?.trees?.find(t => t.id == params.treeId) ?? {};
  const pageId = `tree_${params.treeId}`;

  return <>
    <PageHeader title={`${treeTitle.name} Tree Settings`} breadcrumbs={[{ title: `Pages`, link: `/settings/pages` }, { title: "Edit Page" }]}>
      <CardHeader>
        {!showSidePanel && <button className="btn btn-default" onClick={handleShowSidepanel}>Show Side Panel</button>}
      </CardHeader>
      <div className="container-xl">
        <div className="row row-cards row-deck">
          <div className="col-md-6">
            <div className="card mb-3">
              <div className="card-header">
                <h2 className="card-title">Card Front Widget</h2>
              </div>
              <div className="card-body">
                {!frontId && <>
                  <EmptyContent title="Widget not configured" text="There is not a widget configured for the front of the tree card" buttonText="Add Widget" onClick={() => handleAddShow("front")} />
                </>}
                {widgets && frontId && <>
                  <div className="mb-3" style={{ width: "300px", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    <SortGridItem id={frontId} col={12} item={{ id: 'front', widgetId: frontId }} pageId={pageId} widgets={widgets} trees={treeData?.trees} onAdd={handleAddShow} onResize={handleResize} onDelete={handleFaceDelete} onPublish={handleFacePublish} styles={{}} />
                  </div>
                </>}
              </div>
            </div>
          </div>
        </div>
        <div className="row row-cards row-deck">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Card Back Widget</h2>
              </div>
              <div className="card-body">
                {!backId && <>
                  <EmptyContent title="Widget not configured" text="There is not a widget configured for the back of the tree card" buttonText="Add Widget" onClick={() => handleAddShow('back')} />
                </>}
                {widgets && backId && <>
                  <div className="mb-3" style={{ width: "300px", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    <SortGridItem id={backId} col={12} item={{ id: 'back', widgetId: backId }} pageId={pageId} widgets={widgets} trees={treeData?.trees} onAdd={handleAddShow} onResize={handleResize} onDelete={handleFaceDelete} onPublish={handleFacePublish} styles={{}} />
                  </div>
                </>}

              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>

    <OffCanvas showModal={showSidePanel} onHide={handleHideSidePanel}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <div className="row g-2 align-items-top">
              <div className="col ">
                <h2 className="card-title m-0">Tree Side Panel</h2>
              </div>
            </div>
          </h2>
          <div className="card-actions">
            <button type="button" className="btn-close text-reset" onClick={handleHideSidePanel} ></button>
          </div>
        </div>

        {(!items || items.length == 0) && <>
          <EmptyContent />
        </>}
        {widgets && items && <>
          <div ref={containerRef}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((item) => item.title)} strategy={rectSwappingStrategy}>
                <div className="row row-cards row-deck mb-3">
                  {items && items.map((item, itemIndex) => {
                    return <SortGridItem key={item.id} id={item.id} col={item.columns} item={item} pageId={pageId} widgets={widgets} trees={treeData?.trees} onAdd={handleAddShow} onResize={handleResize} onDelete={handleDelShow} onPublish={handlePublish} styles={activeIndex === itemIndex ? { opacity: 0 } : {}} />
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
        <div className="card-footer">
          <div className="row">
            <div className="col"></div>
            <div className="col-auto">
              <button className="btn btn-default" onClick={() => handleAddShow()}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-layout-grid-add" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M14 17h6m-3 -3v6"></path></svg>
                Add Widget
              </button>
            </div>
          </div>
        </div>
      </div>
    </OffCanvas >

    <Modal showModal={showEdit} onHide={handleAddhide}>
      <div className="modal-header">
        <h5 className="modal-title">Widget Settings</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Widget Type</label>
              <SelectInput name="widgetId" value={current?.widgetId ?? ''} emptyOption="-- Select Type --" onChange={handleActiveEdit}>
                {WidgetTypes && Object.keys(WidgetTypes).map((key) => {
                  return <option key={key} value={WidgetTypes[key]}>{key}</option>
                })}
              </SelectInput>
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

export default TreeSettings;
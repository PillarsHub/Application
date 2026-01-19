import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/modal.jsx';
import AutoComplete from '../../../components/autocomplete.jsx';
import Switch from '../../../components/switch.jsx';
import { SendRequest } from "../../../hooks/usePost.js";
import { GetScope } from "../../../features/authentication/hooks/useToken.jsx";

const PAGE_SIZE = 300; // API cap

// Wrap SendRequest so we can await it and keep the status code
const sendRequestAsync = (method, url, body = null) =>
  new Promise((resolve, reject) => {
    try {
      SendRequest(
        method,
        url,
        body,
        (data) => resolve(data),
        (err, code) => reject({ error: err, status: code })
      );
    } catch (err) {
      reject({ error: err, status: err?.status ?? err?.statusCode });
    }
  });

const isConflictError = (e) => {
  const status = e?.status ?? e?.code ?? e?.statusCode;
  if (status === 409) return true;
  const msg = e?.error?.message ?? e?.message ?? (typeof e?.error === 'string' ? e.error : '');
  return typeof msg === 'string' && msg.includes('409');
};

// Copy with dynamic suffix (omit Holding Tank if disallowed)
const choiceSuffix = (canUseHoldingTank) =>
  canUseHoldingTank ? ' Choose a different leg or select Holding Tank.' : ' Choose a different leg.';

const plural = (n, s) => `${n} ${s}${n === 1 ? '' : 's'}`;

const MESSAGES = {
  requiredUpline: 'Choose a sponsor to place under.',
  requiredLeg: 'Choose a leg to place on.',
  checking: 'Validating the position…',
  occupiedClient: (canUseHoldingTank) =>
    'That leg is already in use under the selected sponsor.' + choiceSuffix(canUseHoldingTank),
  conflict409: (canUseHoldingTank) =>
    'That leg was taken moments ago.' + choiceSuffix(canUseHoldingTank),
  cycleInvalid: 'You can’t place a node under someone in its own downline. Choose a different sponsor.',
  rangeInvalid: (max) => `Selected sponsor is outside your allowed placement range (${plural(max, 'level')} under you). Choose a different sponsor.`,
  verifyFailed: 'We couldn’t confirm the position. Try again.',
  submitGeneric: (msg) => `Couldn’t place this node${msg ? `: ${msg}` : '.'}`,
};

const ChangePlacementModal = ({ tree, treeId, placement, refreshNode }) => {
  const [showModal, setModalShow] = useState(false);
  const [activeItem, setActiveItem] = useState();
  const [disclaimer, setDisclaimer] = useState(false);

  // Availability (leg occupancy)
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [positionAvailable, setPositionAvailable] = useState(true);

  // Cycle & scope-range checks (share the same upline fetch)
  const [checkingCycle, setCheckingCycle] = useState(false);
  const [cycleInvalid, setCycleInvalid] = useState(false);
  const [rangeInvalid, setRangeInvalid] = useState(false);

  // Banner + submit
  const [bannerMsg, setBannerMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const scope = GetScope?.(); // nodeId of scope owner (truthy => scoped)
  const canUseHoldingTank = !scope; // only when token has no scope
  const hasLegs = !!(tree?.legNames && tree.legNames.length > 0);
  const maxMoveLevels = Number(tree?.maximumAllowedMovementLevels ?? 0);
  const enforceRange = !!scope && maxMoveLevels > 0;

  const handleClose = () => setModalShow(false);

  const handleChange = (name, value) => {
    setActiveItem(prev => ({ ...prev, [name]: value }));

    // Smart banner clearing:
    if (name === 'uplineId') {
      // Changing sponsor CAN resolve cycle/range—let the effect re-check
      setCycleInvalid(false);
      setRangeInvalid(false);
      setBannerMsg('');
    } else if (name === 'uplineLeg') {
      // Changing leg does NOT fix cycle/range; keep those banners if present
      if (!cycleInvalid && !rangeInvalid) setBannerMsg('');
    } else {
      setBannerMsg('');
    }
  };

  // Initialize from placement
  useEffect(() => {
    if (placement) {
      const init = { ...placement };

      // Default leg (lowercased) if needed
      if (tree?.legNames && !init.uplineLeg) {
        init.uplineLeg = String(tree.legNames[0] ?? '').toLowerCase();
      }

      // If Holding Tank selected but disallowed, switch to first real leg
      if (
        tree?.legNames?.length &&
        init.uplineLeg?.toLowerCase?.() === 'holding tank' &&
        !canUseHoldingTank
      ) {
        init.uplineLeg = String(tree.legNames[0] ?? '').toLowerCase();
      }

      setDisclaimer(placement?.disclamerId === undefined);
      setActiveItem(init);
      setModalShow(true);
      setSubmitting(false);

      // reset validation state
      setBannerMsg('');
      setCycleInvalid(false);
      setRangeInvalid(false);
      setCheckingCycle(false);
      setPositionAvailable(true);
      setCheckingAvailability(false);
    } else {
      setActiveItem(undefined);
      setModalShow(false);
      setDisclaimer(false);
      setPositionAvailable(true);
      setCheckingAvailability(false);
      setCycleInvalid(false);
      setRangeInvalid(false);
      setCheckingCycle(false);
      setSubmitting(false);
      setBannerMsg('');
    }
  }, [placement, tree?.legNames, canUseHoldingTank, maxMoveLevels, scope]);

  // ----- Cycle + scope-range check (one upline fetch does both) -----
  useEffect(() => {
    const movingNodeId = activeItem?.nodeId;
    const candidateUplineId = activeItem?.uplineId;

    if (!movingNodeId || !candidateUplineId) {
      setCycleInvalid(false);
      setRangeInvalid(false);
      setCheckingCycle(false);
      return;
    }

    // quick self-check (placing under itself)
    if (candidateUplineId === movingNodeId) {
      setCycleInvalid(true);
      setRangeInvalid(false);
      setCheckingCycle(false);
      setBannerMsg(MESSAGES.cycleInvalid);
      return;
    }

    let cancelled = false;

    const t = setTimeout(async () => {
      try {
        setCheckingCycle(true);

        const url = `/api/v1/Trees/${encodeURIComponent(treeId)}/Nodes/${encodeURIComponent(candidateUplineId)}/upline`;
        const chain = await sendRequestAsync('GET', url, null);
        const list = Array.isArray(chain) ? chain : (chain?.items ?? []);

        // --- Recursion (cycle) ---
        const includesMoving =
          Array.isArray(list) && list.some(n => (n?.nodeId ?? '').toString() === movingNodeId);

        // --- Scope range (only if scoped & maxMoveLevels > 0) ---
        let rangeBad = false;
        if (enforceRange) {
          const scopeId = String(scope);
          const idx = Array.isArray(list)
            ? list.findIndex(n => (n?.nodeId ?? '').toString() === scopeId)
            : -1;

          if (idx === -1) {
            // new upline is NOT under scope at all
            rangeBad = true;
          } else {
            // Distance from candidate to scope.
            // If the upline list includes the candidate itself at index 0, distance = idx.
            // Usually /upline returns ancestors (excluding self), so distance = idx + 1.
            const includesSelf = list.some(n => (n?.nodeId ?? '').toString() === candidateUplineId);
            const distance = includesSelf ? idx : idx + 1;
            rangeBad = distance > maxMoveLevels;
          }
        }

        if (!cancelled) {
          setCycleInvalid(!!includesMoving);
          setRangeInvalid(!!rangeBad);

          if (includesMoving) {
            setBannerMsg(MESSAGES.cycleInvalid);
          } else if (rangeBad) {
            setBannerMsg(MESSAGES.rangeInvalid(maxMoveLevels));
          } else {
            setBannerMsg(prev => (prev === MESSAGES.cycleInvalid || prev.startsWith('Selected sponsor is outside') ? '' : prev));
          }
        }
      } catch (_e) {
        if (!cancelled) {
          // conservative: if we can't verify ancestry, block submit
          setCycleInvalid(true);
          setRangeInvalid(false);
          setBannerMsg(MESSAGES.verifyFailed);
        }
      } finally {
        if (!cancelled) setCheckingCycle(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [treeId, activeItem?.uplineId, activeItem?.nodeId, enforceRange, maxMoveLevels, scope]);

  // ----- Leg occupancy availability (skip if cycle/range invalid) -----
  const fetchChildrenPage = async (uplineId, offset, count) => {
    const url = `/api/v1/Trees/${encodeURIComponent(treeId)}/Nodes/${encodeURIComponent(uplineId)}/downline?levels=1&offset=${offset}&count=${count}`;
    const data = await sendRequestAsync('GET', url, null);
    return Array.isArray(data) ? data : [];
  };

  const findLegOccupiedAcrossPages = async (uplineId, leg, movingNodeId, getCancelled) => {
    let offset = 0;
    let loop = true;
    while (loop) {
      if (getCancelled?.()) return false;
      const page = await fetchChildrenPage(uplineId, offset, PAGE_SIZE);
      if (getCancelled?.()) return false;

      const occupied = page.some(c => {
        const childLeg = (c?.uplineLeg ?? '').toLowerCase().trim();
        const sameNode = movingNodeId && c?.nodeId === movingNodeId;
        return !sameNode && childLeg === leg;
      });
      if (occupied) return true;

      if (page.length < PAGE_SIZE) return false; // no more pages
      offset += page.length;
    }
  };

  useEffect(() => {
    if (!hasLegs) {
      setPositionAvailable(true);
      setCheckingAvailability(false);
      return;
    }

    // If cycle or range invalid (or being checked), don't run occupancy
    if (cycleInvalid || rangeInvalid || checkingCycle) {
      setCheckingAvailability(false);
      return;
    }

    const uplineId = activeItem?.uplineId;
    const leg = activeItem?.uplineLeg?.toLowerCase?.().trim?.();

    if (!uplineId || !leg) {
      setPositionAvailable(false);
      setCheckingAvailability(false);
      return;
    }

    // Holding Tank auto-valid only when allowed
    if (leg === 'holding tank' && canUseHoldingTank) {
      setPositionAvailable(true);
      setCheckingAvailability(false);
      return;
    }

    let cancelled = false;
    const getCancelled = () => cancelled;

    const t = setTimeout(async () => {
      try {
        setCheckingAvailability(true);

        const movingNodeId = activeItem?.nodeId;
        const occupied = await findLegOccupiedAcrossPages(uplineId, leg, movingNodeId, getCancelled);

        if (!cancelled) {
          setPositionAvailable(!occupied);
          // Only set banner if NOT blocked by cycle/range (priority)
          if (!cycleInvalid && !rangeInvalid) {
            setBannerMsg(occupied ? MESSAGES.occupiedClient(canUseHoldingTank) : '');
          }
        }
      } catch (_err) {
        if (!cancelled) {
          setPositionAvailable(false);
          if (!cycleInvalid && !rangeInvalid) setBannerMsg(MESSAGES.verifyFailed);
        }
      } finally {
        if (!cancelled) setCheckingAvailability(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    hasLegs,
    treeId,
    activeItem?.uplineId,
    activeItem?.uplineLeg,
    activeItem?.nodeId,
    canUseHoldingTank,
    cycleInvalid,
    rangeInvalid,
    checkingCycle
  ]);

  // ----- Submit -----
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!activeItem?.uplineId) {
      setBannerMsg(MESSAGES.requiredUpline);
      return;
    }

    let uplineLeg = activeItem?.uplineLeg;
    if (!uplineLeg) {
      if (hasLegs) {
        setBannerMsg(MESSAGES.requiredLeg);
        return;
      } else {
        uplineLeg = activeItem.nodeId; // single-leg trees: default uplineLeg to nodeId
      }
    }

    // Cycle/range guards (share checkingCycle)
    if (checkingCycle) {
      setBannerMsg(MESSAGES.checking);
      return;
    }
    if (cycleInvalid) {
      setBannerMsg(MESSAGES.cycleInvalid);
      return;
    }
    if (rangeInvalid) {
      setBannerMsg(MESSAGES.rangeInvalid(maxMoveLevels));
      return;
    }

    // Availability guards (only when legs exist and HT not used/allowed)
    if (hasLegs) {
      const leg = uplineLeg.toLowerCase().trim();
      if (leg === 'holding tank' && !canUseHoldingTank) {
        setBannerMsg(MESSAGES.requiredLeg);
        return;
      }
      if (leg !== 'holding tank' || !canUseHoldingTank) {
        if (checkingAvailability) {
          setBannerMsg(MESSAGES.checking);
          return;
        }
        if (!positionAvailable) {
          setBannerMsg(MESSAGES.occupiedClient(canUseHoldingTank));
          return;
        }
      }
    }

    setSubmitting(true);
    setBannerMsg('');

    const payload = { ...activeItem, uplineLeg };
    const url = `/api/v1/Trees/${treeId}/Nodes/${activeItem.nodeId}`;

    try {
      await sendRequestAsync('PUT', url, payload);
      setModalShow(false);
      refreshNode(payload);
    } catch (e) {
      setSubmitting(false);

      if (isConflictError(e) && hasLegs && payload.uplineLeg?.toLowerCase() !== 'holding tank') {
        setPositionAvailable(false);
        setBannerMsg(MESSAGES.conflict409(canUseHoldingTank));
        return;
      }

      setBannerMsg(MESSAGES.submitGeneric(e?.error?.message ?? e?.message ?? e?.error));
    }
  };

  const uplineColWidth = hasLegs ? 8 : 12;
  const canSubmit =
    !submitting &&
    disclaimer &&
    !!activeItem?.uplineId &&
    !checkingCycle &&
    !cycleInvalid &&
    !rangeInvalid &&
    (!hasLegs || !!activeItem?.uplineLeg) &&
    (!hasLegs ||
      (canUseHoldingTank && activeItem?.uplineLeg?.toLowerCase?.().trim?.() === 'holding tank') ||
      (positionAvailable && !checkingAvailability));

  return (
    <Modal showModal={showModal} onHide={handleClose}>
      <div className="modal-header">
        <h5 className="modal-title">Change Placement</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={handleClose} disabled={submitting} />
      </div>

      <div className="modal-body">
        <div className="row">
          <div className={`col-md-${uplineColWidth}`}>
            <div className="mb-3">
              <label className="form-label">Place Under</label>
              <AutoComplete name="uplineId" value={activeItem?.uplineId ?? ""} onChange={handleChange} disabled={submitting} />
            </div>
          </div>

          {hasLegs && (
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Place on Leg</label>
                <select className="form-select" name="uplineLeg" value={activeItem?.uplineLeg?.toLowerCase() ?? ""} onChange={(e) => handleChange(e.target.name, e.target.value)} disabled={submitting} >
                  {tree.legNames.map((leg) => (
                    <option key={leg} value={leg.toLowerCase()}>
                      {leg}
                    </option>
                  ))}
                  {canUseHoldingTank && <option value="holding tank">Holding Tank</option>}
                </select>
              </div>
            </div>
          )}
        </div>

        {(checkingAvailability || checkingCycle) && (
          <div className="form-text d-none">{MESSAGES.checking}</div>
        )}

        {bannerMsg && (
          <div className="alert alert-danger mb-3" role="alert">
            {bannerMsg}
          </div>
        )}

        {placement?.disclamerId && (
          <Switch onChange={(_n, v) => setDisclaimer(v)} value={disclaimer} disabled={submitting}
            title="I understand that all tree-based sponsor commissions I would have received during an open period for activities of this person will be removed from my commissions and paid to this person's new sponsor."
          />
        )}
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary" data-bs-dismiss="modal" onClick={handleClose} disabled={submitting}>Cancel</button>
        <button className="btn btn-primary ms-auto" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Placing…
            </>
          ) : (
            'Place Node'
          )}
        </button>
      </div>
    </Modal>
  );
};

ChangePlacementModal.propTypes = {
  tree: PropTypes.any,
  treeId: PropTypes.string.isRequired,
  placement: PropTypes.any,
  refreshNode: PropTypes.func.isRequired
};

export default ChangePlacementModal;

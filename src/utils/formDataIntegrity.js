const CONTAINER_SIZES = {
  FieldSet: 1,
  TwoColumnRow: 2,
  ThreeColumnRow: 3,
};

function getContainerSize(item) {
  if (item.element === 'MultiColumnRow') return item.col_count || 4;
  return CONTAINER_SIZES[item.element];
}

function ensureContainer(item) {
  const containerSize = getContainerSize(item);
  const isContainer = item.isContainer === true || Array.isArray(item.childItems) || containerSize !== undefined;
  if (!isContainer) return false;

  // These fields must exist before the first render/save, not be added by the
  // column component as a render side effect.
  // eslint-disable-next-line no-param-reassign
  item.isContainer = true;
  if (!Array.isArray(item.childItems)) {
    // eslint-disable-next-line no-param-reassign
    item.childItems = Array.from({ length: containerSize || 1 }, () => null);
  } else if (containerSize && item.childItems.length < containerSize) {
    while (item.childItems.length < containerSize) item.childItems.push(null);
  }
  return true;
}

function detach(item) {
  // eslint-disable-next-line no-param-reassign
  delete item.parentId;
  // eslint-disable-next-line no-param-reassign
  delete item.parentIndex;
  // eslint-disable-next-line no-param-reassign
  delete item.col;
}

/**
 * Repairs the denormalized parent/child relationship in place so existing
 * object identities remain valid while a React DnD operation is in progress.
 */
export default function normalizeFormData(data) {
  if (!Array.isArray(data)) return [];

  const items = data.filter(Boolean);
  const byId = new Map(items.map(item => [item.id, item]));
  const containers = new Set(items.filter(ensureContainer));
  const claimedChildren = new Set();

  // A container slot is the strongest source of truth. Repair child metadata
  // from it, and clear references that cannot possibly be rendered.
  containers.forEach(parent => {
    parent.childItems.forEach((childId, col) => {
      if (!childId) return;
      const child = byId.get(childId);
      if (!child || child === parent || containers.has(child) || claimedChildren.has(childId)) {
        // eslint-disable-next-line no-param-reassign
        parent.childItems[col] = null;
        return;
      }

      claimedChildren.add(childId);
      // eslint-disable-next-line no-param-reassign
      child.parentId = parent.id;
      // eslint-disable-next-line no-param-reassign
      child.parentIndex = items.indexOf(parent);
      // eslint-disable-next-line no-param-reassign
      child.col = col;
    });
  });

  // Recover one-sided child relationships where possible. An orphan whose
  // parent is gone (or has no free slot) is promoted to a root item instead of
  // being left invisible.
  items.forEach(child => {
    if (containers.has(child) || claimedChildren.has(child.id)) return;

    const parent = byId.get(child.parentId);
    if (parent && containers.has(parent)) {
      let col = Number.isInteger(child.col) ? child.col : -1;
      if (col < 0 || col >= parent.childItems.length || parent.childItems[col]) {
        col = parent.childItems.findIndex(childId => !childId);
      }
      if (col !== -1) {
        // eslint-disable-next-line no-param-reassign
        parent.childItems[col] = child.id;
        // eslint-disable-next-line no-param-reassign
        child.parentId = parent.id;
        // eslint-disable-next-line no-param-reassign
        child.parentIndex = items.indexOf(parent);
        // eslint-disable-next-line no-param-reassign
        child.col = col;
        claimedChildren.add(child.id);
        return;
      }
    }

    detach(child);
  });

  return items;
}

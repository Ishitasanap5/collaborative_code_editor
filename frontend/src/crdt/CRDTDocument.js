import { CRDTElement } from "./CRDTElement";
import { CRDTOperation } from "./CRDTOperation";

export class CRDTDocument {

    constructor(clientId) {

        this.clientId = clientId;

        this.clock = 0;
        this.counter = 0;
        this.baselineVersion = 0;

        // id -> CRDTElement (includes tombstones)
        this.elementMap = new Map();

        // INSERTs waiting for their parent: id -> element
        this.pendingOperations = new Map();

        // DELETEs that arrived before their INSERT
        this.pendingDeletes = new Set();

        this.processedOperations = new Set();

        // Caches (invalidated on mutation)
        this.orderedCache = null;
        this.visibleCache = null;
    }

    // CACHE HELPERS
    invalidateOrder() {
        this.orderedCache = null;
        this.visibleCache = null;
    }

    invalidateVisible() {
        this.visibleCache = null;
    }

    // IDS
    generateId() {
        // NOTE: counter is never reset, so ids stay unique
        // even after a snapshot restore.
        this.counter++;
        return `${this.clientId}:${this.counter}`;
    }

    getOperationId(operation) {

        if (
            !operation ||
            !operation.type ||
            !operation.element ||
            !operation.element.id
        ) {
            return null;
        }

        return `${operation.type}:${operation.element.id}`;
    }

    // Plain copy so queued operations never alias live elements.
    toPlain(element) {

        return {
            id: element.id,
            value: element.value,
            afterId: element.afterId ?? null,
            clientId: element.clientId,
            clock: element.clock,
            deleted: Boolean(element.deleted)
        };
    }

    // INITIALIZE / RESET FROM BASELINE TEXT
    initializeFromText(text, documentId, baselineVersion = 0) {

        this.elementMap.clear();
        this.pendingOperations.clear();
        this.pendingDeletes.clear();
        this.processedOperations.clear();

        this.clock = 0;
        this.baselineVersion = Number(baselineVersion ?? 0);

        const content = text || "";

        let previousId = null;

        for (let i = 0; i < content.length; i++) {

            const id =
                `baseline:${documentId}:${this.baselineVersion}:${i}`;

            // clock 0 for ALL baseline elements (was `i`, which
            // made new inserts sort after the rest of the document)
            const element = new CRDTElement(
                id,
                content[i],
                previousId,
                "initial",
                0
            );

            element.deleted = false;

            this.elementMap.set(id, element);

            previousId = id;
        }

        this.invalidateOrder();
    }

    resetFromText(text, documentId, baselineVersion = 0) {
        this.initializeFromText(text || "", documentId, baselineVersion);
    }

    // LOCAL INSERT
    insert(value, afterId = null) {

        if (afterId !== null && !this.elementMap.has(afterId)) {
            console.warn("⚠️ Cannot insert after unknown element:", afterId);
            return null;
        }

        this.clock++;

        const element = new CRDTElement(
            this.generateId(),
            value,
            afterId,
            this.clientId,
            this.clock
        );

        element.deleted = false;

        this.elementMap.set(element.id, element);
        this.invalidateOrder();

        const operation = new CRDTOperation(
            "INSERT",
            this.toPlain(element),
            this.clientId
        );

        this.processedOperations.add(this.getOperationId(operation));

        return operation;
    }

    // LOCAL DELETE
    delete(elementId) {

        const element = this.elementMap.get(elementId);

        if (!element || element.deleted) {
            return null;
        }

        element.deleted = true;
        this.invalidateVisible();

        const plain = this.toPlain(element);
        plain.deleted = true;

        const operation = new CRDTOperation(
            "DELETE",
            plain,
            this.clientId
        );

        this.processedOperations.add(this.getOperationId(operation));

        return operation;
    }

    // APPLY REMOTE OPERATION
    applyOperation(operation) {

        if (!operation || !operation.type || !operation.element) {
            return;
        }

        const element = operation.element;
        const operationId = this.getOperationId(operation);

        if (operationId && this.processedOperations.has(operationId)) {
            return;
        }

        // Lamport clock
        if (typeof element.clock === "number") {
            this.clock = Math.max(this.clock, element.clock);
        }

        if (operation.type === "INSERT") {

            if (this.elementMap.has(element.id)) {
                if (operationId) this.processedOperations.add(operationId);
                return;
            }

            // Parent not here yet -> wait for it
            if (
                element.afterId !== null &&
                element.afterId !== undefined &&
                !this.elementMap.has(element.afterId)
            ) {
                this.pendingOperations.set(element.id, element);
                return;
            }

            this.applyInsert(element);

            if (operationId) this.processedOperations.add(operationId);

            this.applyPendingOperations();

            return;
        }

        if (operation.type === "DELETE") {

            this.applyDelete(element);

            if (operationId) this.processedOperations.add(operationId);

            return;
        }

        console.warn("⚠️ Unknown operation type:", operation.type);
    }

    applyInsert(element) {

        if (!element || !element.id || this.elementMap.has(element.id)) {
            return;
        }

        const newElement = new CRDTElement(
            element.id,
            element.value,
            element.afterId ?? null,
            element.clientId,
            Number(element.clock) || 0
        );

        newElement.deleted = false;

        this.elementMap.set(newElement.id, newElement);
        this.invalidateOrder();

        if (this.pendingDeletes.has(newElement.id)) {
            newElement.deleted = true;
            this.pendingDeletes.delete(newElement.id);
        }
    }

    applyDelete(element) {

        if (!element || !element.id) {
            return;
        }

        const existing = this.elementMap.get(element.id);

        if (!existing) {
            this.pendingDeletes.add(element.id);
            return;
        }

        if (!existing.deleted) {
            existing.deleted = true;
            this.invalidateVisible();
        }
    }

    applyPendingOperations() {

        let progress = true;

        while (progress) {

            progress = false;

            for (const [id, element] of this.pendingOperations) {

                if (
                    element.afterId !== null &&
                    element.afterId !== undefined &&
                    !this.elementMap.has(element.afterId)
                ) {
                    continue;
                }

                this.pendingOperations.delete(id);

                this.applyInsert(element);

                this.processedOperations.add(`INSERT:${element.id}`);

                progress = true;
            }
        }
    }

    // ORDERING
    compareElements(a, b) {

        if (a.clock !== b.clock) {
            return b.clock - a.clock;
        }

        if (a.clientId !== b.clientId) {
            return a.clientId < b.clientId ? 1 : -1;
        }

        if (a.id !== b.id) {
            return a.id < b.id ? 1 : -1;
        }

        return 0;
    }

    buildChildrenMap() {

        const childrenMap = new Map();

        for (const element of this.elementMap.values()) {

            const parentId = element.afterId ?? null;

            if (!childrenMap.has(parentId)) {
                childrenMap.set(parentId, []);
            }

            childrenMap.get(parentId).push(element);
        }

        for (const children of childrenMap.values()) {
            children.sort((a, b) => this.compareElements(a, b));
        }

        return childrenMap;
    }

    getOrderedElements() {

        if (this.orderedCache) {
            return this.orderedCache;
        }

        const childrenMap = this.buildChildrenMap();

        const ordered = [];
        const stack = [];

        const roots = childrenMap.get(null) || [];

        for (let i = roots.length - 1; i >= 0; i--) {
            stack.push(roots[i]);
        }

        while (stack.length > 0) {

            const element = stack.pop();

            ordered.push(element);

            const children = childrenMap.get(element.id);

            if (children) {
                for (let i = children.length - 1; i >= 0; i--) {
                    stack.push(children[i]);
                }
            }
        }

        this.orderedCache = ordered;

        return ordered;
    }

    getVisibleElements() {

        if (!this.visibleCache) {
            this.visibleCache =
                this.getOrderedElements().filter(e => !e.deleted);
        }

        return this.visibleCache;
    }

    getText() {
        return this.getVisibleElements().map(e => e.value).join("");
    }

    getElementAtPosition(position) {

        const visible = this.getVisibleElements();

        if (position < 0 || position >= visible.length) {
            return null;
        }

        return visible[position];
    }

    getElementBeforePosition(position) {

        if (position <= 0) {
            return null;
        }

        const visible = this.getVisibleElements();

        return visible[Math.min(position, visible.length) - 1] ?? null;
    }

    getElementsInRange(start, length) {
        return this.getVisibleElements().slice(start, start + length);
    }

    // DEBUG
    debugPrint() {

        console.log("Client:", this.clientId, "| baseline:", this.baselineVersion, "| clock:", this.clock);
        console.log("Text:", JSON.stringify(this.getText()));
        console.table(
            this.getOrderedElements().map(e => ({
                id: e.id,
                value: e.value,
                afterId: e.afterId,
                clock: e.clock,
                deleted: e.deleted
            }))
        );
        console.log("Pending INSERTs:", this.pendingOperations);
        console.log("Pending DELETEs:", this.pendingDeletes);
    }
}
export class CRDTElement {
  constructor(
    id,
    value,
    afterId = null,
    clientId = null,
    clock = 0
  ) {
    this.id = id;
    this.value = value;
    this.afterId = afterId;
    this.clientId = clientId;
    this.clock = clock;
    this.deleted = false;
  }
}

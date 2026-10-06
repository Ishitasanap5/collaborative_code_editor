export class CRDTOperation {
  constructor(type, element, clientId) {
    this.type = type;
    this.element = element;
    this.clientId = clientId;
  }
}
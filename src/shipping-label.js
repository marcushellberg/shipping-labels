import { html, LitElement } from '@polymer/lit-element';

class ShippingLabel extends LitElement {
  static get properties() {
    return {
      shippingLocation: { type: String },
      shipmentDetails: { type: Object }
    };
  }

  render() {
    return html`
      ${this.getStyles()}

      <div class="extraInfo">${this.shipmentDetails.extraInfo}</div>
      <div class="extraInfo">${this.shipmentDetails.extraInfo2}</div>
      <div class="name">
        ${this.shipmentDetails.firstName} ${this.shipmentDetails.lastName}
      </div>
      <div class="address">${this.shipmentDetails.street}</div>
      <div class="address2">
        ${
          this.shippingLocation === 'EU'
            ? html`
                ${this.shipmentDetails.zip} ${this.shipmentDetails.city},
                ${this.shipmentDetails.state}
              `
            : html`
                ${this.shipmentDetails.city}, ${this.shipmentDetails.state}
                ${this.shipmentDetails.zip}
              `
        }
        <div class="country">${this.shipmentDetails.country}</div>
        <div class="size">${this.shipmentDetails.size}</div>
      </div>
    `;
  }

  getStyles() {
    return html`
      <style>
        :host {
          box-sizing: border-box;
          display: inline-block;
          page-break-inside: avoid;
          position: relative;
          font-size: 14px;
          line-height: 20px;
          padding: 10px;
          text-transform: capitalize;
        }

        :host(.usa) {
          font-size: 16px;
          line-height: 24px;
          padding: 20px;
        }

        .extraInfo {
          font-size: 0.8em;
          font-weight: 500;
        }

        .size {
          position: absolute;
          bottom: 10px;
          right: 10px;
          font-size: 16px;
        }

        :host(.usa) .size {
          top: 20px;
          right: 20px;
        }
      </style>
    `;
  }
}

customElements.define('shipping-label', ShippingLabel);

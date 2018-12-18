import { html, LitElement } from '@polymer/lit-element';
import { render } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map';
import { parse } from 'papaparse';
import '@vaadin/vaadin-button';
import '@vaadin/vaadin-combo-box';
import '@vaadin/vaadin-dialog';
import '@vaadin/vaadin-text-field';
import '@vaadin/vaadin-upload';
import './shipping-label';

class ShippingLabelsApp extends LitElement {
  static get properties() {
    return {
      location: { type: String },
      shippingInfo: { type: Array },
      editorOpen: { type: Boolean }
    };
  }

  constructor() {
    super();
    this.shippingLocation = 'USA';
    this.shippingInfo = [];
    this.shippingLocations = ['USA', 'EU'];
    this.manualEntry = {};
    this.amount = 20;

    // Needed for using lit-html in the vaadin-dialog renderer
    this.boundEditorRenderer = this.editorRenderer.bind(this);
    this.boundUpdateAddress = this.updateAddress.bind(this);
    this.boundCloseEditor = this.closeEditor.bind(this);
    this.boundGenerateLabels = this.generateLabels.bind(this);
  }

  render() {
    return html`
      ${this.getStyles()}
      <header>
        <h1>Shipping labels</h1>
        <vaadin-upload
          accept="text/csv"
          @upload-before="${this.handleUpload}"
        ></vaadin-upload>
        <vaadin-combo-box
          label="Shipping location"
          .items="${this.shippingLocations}"
          .value="${this.shippingLocation}"
          @value-changed="${this.shippingLocationChanged}"
        ></vaadin-combo-box>
        <vaadin-button @click="${this.openEditor}">Manual entry</vaadin-button>
      </header>
      <vaadin-dialog
        .renderer="${this.boundEditorRenderer}"
        ?opened="${this.editorOpen}"
        no-close-on-outside-click
        no-close-on-esc
      ></vaadin-dialog>
      <div class="labels">
        ${
          this.shippingInfo.map(
            details => html`
              <shipping-label
                .shipmentDetails="${details}"
                class="${classMap({ usa: this.shippingLocation === 'USA' })}"
              ></shipping-label>
            `
          )
        }
      </div>
    `;
  }

  getStyles() {
    return html`
      <style>
        :host {
          display: block;
        }

        header {
          box-sizing: border-box;
          background: #fff;
          width: 100%;
          padding: 16px;
          display: grid;
          grid-template-columns: 40% 1fr 1fr;
          grid-template-rows: repeat(2, 1fr);
          grid-gap: 10px;
          align-items: baseline;
          margin-bottom: 50px;
          font-size: 16px;
          box-shadow: 2px 2px 2px 0px hsla(0, 0%, 0%, 0.1);
        }

        header h1 {
          grid-row: 1;
          grid-column: 1/2;
          width: 100%;
          font-weight: 200;
          text-transform: uppercase;
          letter-spacing: 10%;
        }

        header vaadin-combo-box {
          grid-row: 1;
          grid-column: 3;
        }

        header vaadin-button {
          grid-row: 1;
          grid-column: 4;
        }

        header vaadin-upload {
          grid-row: 2;
          grid-column: 1/5;
        }

        shipping-label {
          width: 69mm;
          height: 37mm;
          box-sizing: border-box;
          page-break-inside: avoid;
        }

        shipping-label.usa {
          height: 2in;
          width: 3.8in;
          vertical-align: top;
        }

        .labels {
          background: #fff;
          box-sizing: border-box;
          border: 1px solid #eee;
          box-shadow: 2px 2px 2px 0px hsla(0, 0%, 0%, 0.1);
          margin: 20px auto;
          width: 210mm;
          padding: 0;
        }

        :host(.usa) .labels {
          width: 8.5in;
          padding: 0.5in 0.2in 0.5in 0.2in;
        }

        @media print {
          header {
            display: none;
          }

          .labels,
          :host(.usa) .labels {
            margin: 0;
            padding: 0;
            box-shadow: none;
            width: 100%;
            border: none;
          }

          ${this.getPrintPageSettings()}
        }
      </style>
    `;
  }

  getPrintPageSettings() {
    if (this.shippingLocation === 'USA') {
      return `
        @page { size: 8.5in 11in; margin: 0.5in 0.2in 0.5in 0.2in; }
      `;
    } else {
      return `
        @page { size: 210mm 297mm; margin: 0; }
      `;
    }
  }

  handleUpload(e) {
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = () => {
      this.shippingInfo = parse(reader.result, {
        header: true
      }).data;
    };
    reader.readAsText(e.detail.file);
    e.target.files = [];
  }

  editorRenderer(root) {
    const template = html`
      <style>
        .manual {
          box-sizing: border-box;
        }

        .manual .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-gap: 10px;
          align-items: baseline;
          width: 100%;
        }

        .fullwidth {
          width: 100%;
        }
      </style>
      <h2>Create labels manually</h2>
      <div class="manual" @change="${this.boundUpdateAddress}">
        <div class="row">
          <vaadin-text-field
            label="Extra info"
            name="extraInfo"
          ></vaadin-text-field>
          <vaadin-text-field
            label="Extra info 2"
            name="extraInfo2"
          ></vaadin-text-field>
        </div>
        <div class="row">
          <vaadin-text-field
            label="First name"
            name="firstName"
          ></vaadin-text-field>
          <vaadin-text-field
            label="Last name"
            name="lastName"
          ></vaadin-text-field>
        </div>
        <vaadin-text-field
          class="fullwidth"
          label="Street"
          name="street"
        ></vaadin-text-field>
        <div class="row">
          <vaadin-text-field label="City" name="city"></vaadin-text-field>
          <vaadin-text-field label="State" name="state"></vaadin-text-field>
        </div>
        <div class="row">
          <vaadin-text-field label="Zip" name="zip"></vaadin-text-field>
          <vaadin-text-field label="Country" name="country"></vaadin-text-field>
        </div>

        <div class="row">
          <vaadin-text-field
            label="Amount"
            .value="${this.amount}"
            @change="${e => (this.amount = e.target.value)}"
          ></vaadin-text-field>
          <div class="row">
            <vaadin-button @click="${this.boundGenerateLabels}" theme="primary">
              Generate
            </vaadin-button>
            <vaadin-button @click="${this.boundCloseEditor}" theme="tertiary"
              >Close</vaadin-button
            >
          </div>
        </div>
      </div>
    `;
    render(template, root);
  }

  updateAddress(e) {
    const field = e.target;

    this.manualEntry = {
      ...this.manualEntry,
      [field.name]: field.value
    };
  }

  generateLabels() {
    this.shippingInfo = Array(parseInt(this.amount))
      .fill()
      .map(() => {
        return { ...this.manualEntry };
      });
    this.manualEntry = {};
    this.closeEditor();
  }

  shippingLocationChanged(e) {
    this.shippingLocation = e.target.value;
  }

  openEditor() {
    this.editorOpen = true;
  }

  closeEditor() {
    this.editorOpen = false;
  }

  set shippingLocation(location) {
    this.location = location;
    this.className = location.toLowerCase();
  }

  get shippingLocation() {
    return this.location;
  }
}

customElements.define('shipping-labels-app', ShippingLabelsApp);

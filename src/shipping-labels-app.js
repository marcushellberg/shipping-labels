import { html, LitElement } from 'lit-element';
import { render } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map';
import { parse } from 'papaparse';
import '@vaadin/vaadin-button';
import '@vaadin/vaadin-combo-box';
import '@vaadin/vaadin-dialog';
import '@vaadin/vaadin-text-field';
import '@vaadin/vaadin-upload';
import './shipping-label';
import './styles.css';

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
    this.margins = new Map([
      [
        'USA',
        {
          top: '0.5in',
          left: '0.2in'
        }
      ],
      [
        'EU',
        {
          top: '1mm',
          left: '3mm'
        }
      ]
    ]);
    this.setMarginsByLocation();
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
      <header>
        <h1>Shipping labels</h1>
        <vaadin-upload accept="text/csv" @upload-before=${this.handleUpload}></vaadin-upload>
        <div class="print-settings">
          <vaadin-text-field
            label="Top margin"
            .value=${this.marginTop}
            name="marginTop"
            @change=${this.marginChanged}
          ></vaadin-text-field>
          <vaadin-text-field
            label="Left margin"
            .value=${this.marginLeft}
            name="marginLeft"
            @change=${this.marginChanged}
          ></vaadin-text-field>
          <vaadin-combo-box
            label="Shipping location"
            .items=${this.shippingLocations}
            .value=${this.shippingLocation}
            @value-changed=${this.shippingLocationChanged}
          >
          </vaadin-combo-box>
        </div>

        <vaadin-button @click=${this.openEditor}>Manual entry</vaadin-button>
      </header>
      <vaadin-dialog
        .renderer=${this.boundEditorRenderer}
        ?opened=${this.editorOpen}
        no-close-on-outside-click
        no-close-on-esc
      ></vaadin-dialog>
      <div class="labels">
        ${this.shippingInfo.map(
          details => html`
            <shipping-label
              .shipmentDetails=${details}
              class=${classMap({ usa: this.shippingLocation === 'USA' })}
            ></shipping-label>
          `
        )}
      </div>
    `;
  }

  createRenderRoot() {
    return this;
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
      <div class="manual" @change=${this.boundUpdateAddress}>
        <div class="row">
          <vaadin-text-field label="Extra info" name="extraInfo"></vaadin-text-field>
          <vaadin-text-field label="Extra info 2" name="extraInfo2"></vaadin-text-field>
        </div>
        <div class="row">
          <vaadin-text-field label="First name" name="firstName"></vaadin-text-field>
          <vaadin-text-field label="Last name" name="lastName"></vaadin-text-field>
        </div>
        <vaadin-text-field class="fullwidth" label="Street" name="street"></vaadin-text-field>
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
            .value=${this.amount}
            @change=${e => (this.amount = e.target.value)}
          ></vaadin-text-field>
          <div class="row">
            <vaadin-button @click=${this.boundGenerateLabels} theme="primary">
              Generate
            </vaadin-button>
            <vaadin-button @click=${this.boundCloseEditor} theme="tertiary">Close</vaadin-button>
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
    this.setMarginsByLocation();
    this.injectPrintPageSettings();
  }

  setMarginsByLocation() {
    const margins = this.margins.get(this.shippingLocation);
    this.marginTop = margins.top;
    this.marginLeft = margins.left;
  }

  marginChanged(e) {
    const { name, value } = e.target;
    this[name] = value;
    this.injectPrintPageSettings();
  }

  injectPrintPageSettings() {
    const pageSettings =
      this.shippingLocation === 'USA'
        ? `@page { size: letter; margin: ${this.marginTop} ${this.marginLeft};`
        : `@page { size: A4; margin: ${this.marginTop} ${this.marginLeft}; }`;

    const oldStyle = document.querySelector('#pageSettings');
    if (oldStyle) {
      oldStyle.parentElement.removeChild(oldStyle);
    }

    const style = document.createElement('style');
    style.type = 'text/css';
    style.media = 'print';
    style.id = 'pageSettings';

    style.appendChild(document.createTextNode(pageSettings));
    document.head.appendChild(style);
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

import Table from './table';
import tableIcon from './img/tableIcon.svg';
import withHeadings from './img/with-headings.svg';
import withoutHeadings from './img/without-headings.svg';
import editable from './img/editable.svg';
import readonly from './img/readonly.svg';
import * as $ from './utils/dom';

/**
 * @typedef {object} TableConfig - configuration that the user can set for the table
 * @property {number} rows - number of rows in the table
 * @property {number} cols - number of columns in the table
 */
/**
 * @typedef {object} Tune - setting for the table
 * @property {string} name - tune name
 * @property {HTMLElement} icon - icon for the tune
 * @property {boolean} isActive - default state of the tune
 * @property {void} setTune - set tune state to the table data
 */
/**
 * @typedef {object} TableData - object with the data transferred to form a table
 * @property {boolean} withHeading - setting to use cells of the first row as headings
 * @property {string[][]} content - two-dimensional array which contains table content
 */

/**
 * Table block for Editor.js
 */
export default class TableBlock {
  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Allow to press Enter inside the CodeTool textarea
   *
   * @returns {boolean}
   * @public
   */
  static get enableLineBreaks() {
    return true;
  }

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {TableData} data — previously saved data
   * @param {TableConfig} config - user config for Tool
   * @param {object} api - Editor.js API
   * @param {boolean} readOnly - read-only mode flag
   */
  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.data = {
      withHeadings: data && data.withHeadings ? data.withHeadings : false,
      readOnly: data && data.readOnly ? data.readOnly : false,
      content: data && data.content ? data.content : []
    };
    this.config = config;
    this.table = null;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: tableIcon,
      title: 'Table'
    };
  }

  /**
   * Plugins styles
   *
   * @returns {{settingsWrapper: string}}
   */
  static get CSS() {
    return {
      settingsWrapper: 'tc-settings',
      extraSettingsWrapper: 'tc-settings-extra',
    };
  }

  renderTable() {
    if (!this.container)
      return;

    this.container.innerHTML = '';

    /** creating table */
    this.table = new Table(this.data.readOnly, this.api, this.data, this.config);
    this.container.appendChild(this.table.getWrapper());
    this.table.setHeadingsSetting(this.data.withHeadings);
  }

  /**
   * Return Tool's view
   *
   * @returns {HTMLDivElement}
   */
  render() {
    /** creating container around table */
    this.container = $.make('div', this.api.styles.block);
    
    this.renderTable();
    return this.container;
  }

  getTunes() {
    return [ {
        title: this.api.i18n.t('With headings'),
        name: 'with-headings',
        icon: withHeadings,
        group: 'headings',
        isActive: this.data.withHeadings,
        setTune: () => {
          this.data.withHeadings = true;
        }
      }, {
        title: this.api.i18n.t('Without headings'),
        name: 'wo-headings',
        icon: withoutHeadings,
        group: 'headings',
        isActive: !this.data.withHeadings,
        setTune: () => {
          this.data.withHeadings = false;
        }
      }, {
        title: this.api.i18n.t('Editable'),
        name: 'editable',
        icon: editable,
        group: 'editing',
        isActive: !this.data.readOnly,
        setTune: () => {
          this.data.readOnly = this.readOnly || false;
        }
      },
      {
        title: this.api.i18n.t('Readonly'),
        name: 'readonly',
        icon: readonly,
        group: 'editing',
        isActive: this.data.readOnly,
        setTune: () => {
          this.data.readOnly = this.readOnly || true;
        }
      }
    ];
  }

  /**
   * Add plugin settings
   *
   * @returns {HTMLElement} - wrapper element
   */
  renderSettings() {
    const wrapper = $.make('div', TableBlock.CSS.settingsWrapper);

    const tunes = this.getTunes();

    tunes.forEach((tune) => {
      let tuneButton = $.make('div', this.api.styles.settingsButton);
      tuneButton.setAttribute('x-tune-name', tune.name);

      if (tune.isActive) {
        tuneButton.classList.add(this.api.styles.settingsButtonActive);
      }

      tuneButton.innerHTML = tune.icon;
      tuneButton.addEventListener('click', () => this.toggleTune(tune, wrapper));

      this.api.tooltip.onHover(tuneButton, tune.title, {
        placement: 'top',
        hidingDelay: 500
      });

      wrapper.append(tuneButton);
    });

    if (this.config.settings && this.config.settings.length > 0) {
      const extraSettingsWrapper = $.make('div', TableBlock.CSS.extraSettingsWrapper);
      this.config.settings.forEach(tune => {
        let tuneButton = $.make('div', this.api.styles.settingsButton);
        tuneButton.innerHTML = tune.icon;
        tuneButton.addEventListener('click', () => tune.onClick({data: this.data}));
        this.api.tooltip.onHover(tuneButton, tune.title, {
          placement: 'top',
          hidingDelay: 500
        });
  
        extraSettingsWrapper.append(tuneButton);
      });

      wrapper.appendChild(extraSettingsWrapper);
    }

    return wrapper;
  }

  /**
   * Extract table data from the view
   *
   * @returns {TableData} - saved data
   */
  save() {
    const tableContent = this.table.getData();

    let result = {
      withHeadings: this.data.withHeadings,
      readOnly: this.data.readOnly,
      content: tableContent
    };

    return result;
  }

  /**
   * Changes the state of the tune
   * Updates its representation in the table
   *
   * @param {Tune} tune - one of the table settings
   * @param {HTMLElement} tuneButton - DOM element of the tune
   * @returns {void}
   */
  toggleTune(tune, wrapper) {
    // Execute button code
    tune.setTune();

    const tunes = this.getTunes();
    tunes.forEach(tune => {
      const tuneButton = wrapper.querySelector('[x-tune-name="' + tune.name + '"]');
      if (tune.isActive) {
        tuneButton.classList.add(this.api.styles.settingsButtonActive);
      } else {
        tuneButton.classList.remove(this.api.styles.settingsButtonActive);
      }
    });

    if (tune.group === "editing") {
      this.data.content = this.table.getData();
      this.renderTable();
    } else if (tune.group === "headings")
      this.table.setHeadingsSetting(this.data.withHeadings);
  }

  /**
   * Plugin destroyer
   *
   * @returns {void}
   */
  destroy() {
    this.table.destroy();
  }
}

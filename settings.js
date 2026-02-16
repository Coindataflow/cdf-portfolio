const html = String.raw;
export default {
  props: ["show"],
  data() {
    return {
    };
  },
  methods: {
    onClose() {
      this.$emit("onClose");
    },
  },
  template: html`
    <div class="cdf-modal cdf-modal--small-on-mobile" :class="{'cdf-modal--show': show}" @mousedown.self="onClose">
      <div class="cdf-modal-dialog cdf-modal-dialog--sm" @mousedown.self="onClose">
        <div class="cdf-modal-content">
          <div class="cdf-modal-header">
            <div class="cdf-modal-header__left">
              <div class="cdf-modal-title">Manage Portfolio</div>
            </div>
            <div class="cdf-modal-header__right">
              <button class="cdf-modal-close-btn" type="button" @click="onClose">
                <svg class="icon">
                  <use xlink:href="#close"></use>
                </svg>
              </button>
            </div>
          </div><!-- .cdf-modal-header -->
          <div class="cdf-modal-body">
            <div class="cdf-modal-section">
              <label class="cdf-switch">
                <span class="cdf-switch__label">Balance Chart</span>
                <input class="cdf-switch__input" type="checkbox">
                <span class="cdf-switch__slider"></span>
              </label>
            </div>
            <div class="cdf-modal-section">
              <label class="cdf-switch">
                <span class="cdf-switch__label">Performance</span>
                <input class="cdf-switch__input" type="checkbox">
                <span class="cdf-switch__slider"></span>
              </label>
            </div>
            <div class="cdf-modal-section">
              <label class="cdf-switch">
                <span class="cdf-switch__label">Holdings Share Chart</span>
                <input class="cdf-switch__input" type="checkbox">
                <span class="cdf-switch__slider"></span>
              </label>
            </div>
            <div class="cdf-modal-section">
              <label class="cdf-switch">
                <span class="cdf-switch__label">Upcoming Events</span>
                <input class="cdf-switch__input" type="checkbox">
                <span class="cdf-switch__slider"></span>
              </label>
            </div>
            <div class="cdf-modal-section">
              <label class="cdf-switch">
                <span class="cdf-switch__label">Notes</span>
                <input class="cdf-switch__input" type="checkbox">
                <span class="cdf-switch__slider"></span>
              </label>
            </div>
            <div class="cdf-modal-section">
              <label class="cdf-switch">
                <span class="cdf-switch__label">Include in Total</span>
                <input class="cdf-switch__input" type="checkbox">
                <span class="cdf-switch__slider"></span>
              </label>
            </div>
            <div class="cdf-modal-section-separator"></div>
            <div class="cdf-modal-section">
              <ul class="pf-menu">
                <li class="pf-menu-item">
                  <span class="pf-menu-item__icon">
                    <svg class="pf-menu-item__icon__svg">
                      <use xlink:href="#edit"></use>
                    </svg>
                  </span>
                  <span class="pf-menu-item__label">Edit portfolio</span>
                </li>
                <li class="pf-menu-item">
                  <span class="pf-menu-item__icon">
                    <svg class="pf-menu-item__icon__svg">
                      <use xlink:href="#duplicate"></use>
                    </svg>
                  </span>
                  <span class="pf-menu-item__label">Duplicate portfolio</span>
                </li>
                <li class="pf-menu-item">
                  <span class="pf-menu-item__icon">
                    <svg class="pf-menu-item__icon__svg">
                      <use xlink:href="#trash"></use>
                    </svg>
                  </span>
                  <span class="pf-menu-item__label">Delete portfolio</span>
                </li>
              </ul>
            </div>
          </div><!-- .cdf-modal-body -->
          <div class="cdf-modal-footer" style="display:none;">
            <!-- modal footer -->
          </div><!-- .cdf-modal-footer -->
        </div>
      </div>
      <!-- .cdf-modal-dialog -->
    </div>
    <!-- .cdf-modal -->
  `,
};

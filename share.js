import {updatePortfolio} from "./api";

const html = String.raw;
export default {
  props: ["show", "currentPortfolio", "isGuest"],
  data() {
    return {
      enable: false,
      url: null,
    };
  },
  watch: {
    show() {
      const pf = this.currentPortfolio;
      this.enable = pf ? !!pf.is_public : false;
      this.url = pf ? pf.public_url : null;
    },
  },
  methods: {
    onClose() {
      this.$emit("onClose");
    },
    async copyUrl() {
      try {
        await navigator.clipboard.writeText(this.currentPortfolio.public_url);
        console.log('Text copied to clipboard successfully!');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    },
    async onChange() {
      console.log(this.enable);
      const pf = this.currentPortfolio;
      if (pf) {
        const response = await updatePortfolio({
          id: pf.id,
          is_public: +this.enable,
        });
        const result = await response.json();
        this.url = result.public_url;
      }
    },
  },
  template: html`
    <div class="cdf-modal cdf-modal--small-on-mobile" :class="{'cdf-modal--show': show}" @mousedown.self="onClose">
      <div class="cdf-modal-dialog cdf-modal-dialog--sm" @mousedown.self="onClose">
        <div class="cdf-modal-content">
          <div class="cdf-modal-header">
            <div class="cdf-modal-header__left">
              <div class="cdf-modal-title">Share portfolio</div>
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
              <div class="pf-hero-line">
                <div class="pf-hero-line-left">
                  <div class="pf-hero-line-icon">
                    <svg class="pf-hero-line-icon__svg">
                      <use xlink:href="#share"></use>
                    </svg>
                  </div>
                </div>
                <div class="pf-hero-line-content">
                  <div class="pf-hero-line-title">Share Portfolio</div>
                  <div class="pf-hero-line-description">
                    Make your Portfolio discoverable for Community.
                  </div>
                </div>
                <div class="pf-hero-line-action">
                  <label class="cdf-switch">
                    <input
                      class="cdf-switch__input"
                      type="checkbox"
                      v-model="enable"
                      :disabled="isGuest"
                      @change="onChange"
                    />
                    <span class="cdf-switch__slider"></span>
                  </label>
                </div>
              </div>
              <div v-if="isGuest" style="color: tomato; padding: 7px; border: 1px solid tomato; border-radius: 6px; margin-top: 6px;">
                Please log in to share your portfolio.
              </div>
              <div class="cdf-modal-section" v-if="enable">
                <div style="display: grid; grid-template-columns: 1fr auto; align-items: flex-end; grid-gap: 6px;">
                  <div
                    class="cdf-field"
                    style="margin-bottom: 0;"
                  >
                    <div class="cdf-field__head">
                      <label class="cdf-field-label">URL</label>
                    </div>
                    <div class="cdf-field__body">
                      <div class="cdf-field-input">
                        <div></div>
                        <input
                          class="cdf-field-input__el"
                          type="text"
                          readonly
                          :value="url"
                          placeholder="Portfolio name"
                        />
                        <div class="cdf-field-input__right"></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <button class="cdf-btn cdf-btn--primary" type="button" @click="copyUrl">
                      Copy
                    </button>
                  </div>
                </div>
              </div>
          </div><!-- .cdf-modal-body -->
          <div class="cdf-modal-footer" style="display:none;">
            <!-- modal footer -->
          </div><!-- .cdf-modal-footer -->
        </div>
      </div>
      <!-- .cdf-modal-dialog -->
      </div>
    </div>
    <!-- .cdf-modal -->
  `,
};
